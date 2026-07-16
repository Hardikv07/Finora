const User = require("../models/user");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendemail");

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
        console.log("Password match:", isMatch);
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
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        }).status(200).json({
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

        // 1. Generate secure 32-byte random hex token (Plain text for URL)
        const resetToken = crypto.randomBytes(32).toString("hex");

        // 2. Hash with SHA-256 and save to DB with 15-min expiry
        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
            
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

        await user.save({ validateBeforeSave: false });

        // 3. Create Reset URL (Frontend URL in prod, API URL for testing)
        const resetUrl = `http://localhost:7777/reset-password/${resetToken}`;

        const message = `
            <h3>You requested a password reset</h3>
            <p>Click the link below to reset your password. It expires in 15 minutes:</p>
            <a href="${resetUrl}" target="_blank">${resetUrl}</a>
            <p>If you did not request this, please ignore this email.</p>
        `;

        // 4. Send email
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
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


const resetPasswordWithToken = async (req, res) => {
    try {
        const resetToken = req.params.token;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // 1. Hash incoming URL token to compare with MongoDB hash
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex"); // .digest("hex") converts raw binary SHA-256 hash output into a readable hexadecimal string (64 characters 0-9, a-f)

        // 2. Find user by hashed token AND verify current time < expiry
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired password reset token" });
        }

        // 3. Set new password (pre('save') hook in user.js will automatically bcrypt hash it!)
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

        // SECURITY: TOKEN REPLAY ATTACK DETECTION
        if (!tokenExists) {
            user.refreshTokens = [];
            await user.save();
            res.clearCookie("refreshToken");
            return res.status(403).json({ 
                message: "Security Alert: Token Replay detected. All sessions logged out." 
            });
        }

        // ROTATION: Remove old token and issue new ones
        user.refreshTokens = user.refreshTokens.filter(t => t.token !== incomingRefreshToken);
        const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        user.refreshTokens.push({
            token: newRefreshToken,
            device: req.headers["user-agent"] || "Desktop/Web"
        });
        await user.save();

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};



module.exports = { registerUser, login, forgotPassword, resetPasswordWithToken, refreshTokenController };

