const express = require("express")
const logAudit = require("../middleware/auditmiddleware");
const router = express.Router()

const { registerUser, login, forgotPassword, resetPasswordWithToken, refreshTokenController, logoutController } = require("../controllers/authcontroller");

router.post("/register", registerUser)
router.post("/login", login)
router.post("/forgotpassword", forgotPassword)
router.put("/resetpassword/:token", resetPasswordWithToken);
router.post("/refresh", refreshTokenController);
module.exports = router