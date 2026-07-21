const jwt = require("jsonwebtoken");
const User = require("../models/user");

const protect = async (req,res,next)=>{

    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (token) {
        try {

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            req.user = await User.findById(decoded.id).select("-password");

            next();

        }
        catch(err){

            return res.status(401).json({
                message:"Invalid Token"
            });

        }

    }

    if(!token){

        return res.status(401).json({
            message:"No Token"
        });

    }

}

module.exports = Object.assign(protect, { protect });