import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const userAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.headers.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "NO_TOKEN",
            });
        };

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                console.error("JWT ERROR-------->", err.name);

                if (err.name === "TokenExpiredError") {
                    return res.status(401).json({
                        success: false,
                        message: "TOKEN_EXPIRED",
                    });
                };

                return res.status(401).json({
                    success: false,
                    message: "INVALID_TOKEN",
                });
            };

            // Find user by decoded ID
            const user = await userModel.findById(decoded.id);

            if (!user) {
                return res.status(404).json({ success: false, message: "USER_NOT_FOUND" });
            };

            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: "ACCOUNT_DEACTIVATED",
                });
            };

            req.user = user;

            next();
        });
    } catch (error) {
        console.error("USER AUTH ERROR--------->", error);
        return res.status(500).json({ success: false, message: "SERVER_ERROR" });
    };
};

export default userAuth;