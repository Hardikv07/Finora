const express = require("express")
const logAudit = require("../middleware/auditmiddleware");
const router = express.Router()

const { registerUser, login, forgotPassword, resetPasswordWithOTP, refreshTokenController, logoutController, sendVerificationEmail, verifyEmailOTP, enable2FA, googleOAuthLogin } = require("../controllers/authcontroller");
const { protect } = require("../middleware/authmiddleware");

router.post("/register", registerUser);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword", resetPasswordWithOTP);
router.post("/refresh", refreshTokenController);
router.post("/logout", logoutController);
router.post("/verify-email/send", protect, sendVerificationEmail);
router.post("/verify-email", protect, verifyEmailOTP);
router.post("/2fa/enable", protect, enable2FA);
router.post("/google", googleOAuthLogin);

module.exports = router;