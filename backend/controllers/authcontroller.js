const User = require("../models/user");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendemail");
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE
        }
    );
}

const registerUser = async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create new user
        const user = new User({ name, email, password });
        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error registering user",
            error: error.message,
            stack: error.stack
        });
    }
};

const login = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        // Generate short-lived Access Token (e.g. 15 mins) & long-lived Refresh Token (7 days)
        const token = generateToken(user._id);
        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Save refresh token to user document
        user.refreshTokens.push({
            token: refreshToken,
            device: req.headers["user-agent"] || "Desktop/Web"
        });
        
        await user.save({ validateBeforeSave: false });

        // Set cookies for both tokens
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        };

        res.cookie("token", token, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 mins
        res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
        
        res.status(200).json({
            message: "Login Successful",
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                token: token
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error logging in"
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        if (!email) {
            return res.status(400).json({ message: "Please provide an email address" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No user found with that email" });
        }

        // 1. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Hash with SHA-256 and save to DB
        user.resetPasswordToken = crypto.createHash("sha256").update(otp).digest("hex");
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

        await user.save({ validateBeforeSave: false });

        const message = `
            <h3>You requested a password reset</h3>
            <p>Your password reset OTP is: <strong>${otp}</strong></p>
            <p>It expires in 15 minutes. If you did not request this, please ignore this email.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: "Password Reset Request - Fintech",
                html: message
            });
            return res.status(200).json({ message: "Password reset link sent to email!" });
        } catch (emailError) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: "Email could not be sent" });
        }
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({ message: "Internal Server Error: " + error.message });
    }
};

const resetPasswordWithOTP = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const hashedToken = crypto.createHash("sha256").update(otp.toString()).digest("hex");
        const user = await User.findOne({
            email: email?.trim().toLowerCase(),
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        return res.status(200).json({ message: "Password updated successfully. You can now log in." });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const refreshTokenController = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken;
        if (!incomingRefreshToken) {
            return res.status(401).json({ message: "No refresh token found. Please log in." });
        }

        let decoded;
        try {
            decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (err) {
            return res.status(403).json({ message: "Refresh token expired or invalid." });
        }

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found." });

        const tokenExists = user.refreshTokens.some(t => t.token === incomingRefreshToken);

        if (!tokenExists) {
            user.refreshTokens = [];
            await user.save();
            res.clearCookie("refreshToken");
            return res.status(403).json({ 
                message: "Security Alert: Token Replay detected. All sessions logged out." 
            });
        }

        user.refreshTokens = user.refreshTokens.filter(t => t.token !== incomingRefreshToken);
        const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        user.refreshTokens.push({
            token: newRefreshToken,
            device: req.headers["user-agent"] || "Desktop/Web"
        });
        await user.save();

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        };

        res.cookie("refreshToken", newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

        return res.status(200).json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const logoutController = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            const user = await User.findOne({ "refreshTokens.token": refreshToken });
            if (user) {
                user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
                await user.save({ validateBeforeSave: false });
            }
        }
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        };
        res.clearCookie("token", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error during logout" });
    }
};

const sendVerificationEmail = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.isverified) return res.status(400).json({ message: "Email already verified" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = crypto.createHash("sha256").update(otp).digest("hex");
        user.otpExpire = Date.now() + 15 * 60 * 1000;
        await user.save({ validateBeforeSave: false });

        await sendEmail({
            email: user.email,
            subject: "Email Verification OTP",
            html: `<h3>Your OTP is: ${otp}</h3><p>It expires in 15 minutes.</p>`
        });

        res.status(200).json({ message: "Verification OTP sent to email" });
    } catch (error) {
        res.status(500).json({ message: "Failed to send OTP" });
    }
};

const verifyEmailOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
        const user = await User.findOne({
            _id: req.user.id,
            otpCode: hashedOtp,
            otpExpire: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

        user.isverified = true;
        user.otpCode = undefined;
        user.otpExpire = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ message: "Email successfully verified!" });
    } catch (error) {
        res.status(500).json({ message: "Error verifying email" });
    }
};

const enable2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.twoFactorEnabled = req.body.enable;
        await user.save({ validateBeforeSave: false });
        res.status(200).json({ message: `Two-Factor Authentication ${user.twoFactorEnabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
        res.status(500).json({ message: "Error updating 2FA settings" });
    }
};

const googleOAuthLogin = async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        
        let user = await User.findOne({ email: payload.email });
        if (!user) {
            user = new User({
                name: payload.name,
                email: payload.email,
                password: crypto.randomBytes(16).toString("hex"),
                isverified: payload.email_verified
            });
            await user.save();
        }

        const jwtToken = generateToken(user._id);
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, { expiresIn: "7d" });
        
        user.refreshTokens.push({ token: refreshToken, device: req.headers["user-agent"] || "OAuth" });
        await user.save({ validateBeforeSave: false });

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        };

        res.cookie("token", jwtToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
        res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
        
        res.status(200).json({ message: "OAuth Login Successful", token: jwtToken, refreshToken, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: "OAuth login failed", error: error.message });
    }
};

module.exports = { registerUser, login, forgotPassword, resetPasswordWithOTP, refreshTokenController, logoutController, sendVerificationEmail, verifyEmailOTP, enable2FA, googleOAuthLogin };
