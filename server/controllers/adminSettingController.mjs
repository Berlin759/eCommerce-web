import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";

const getAdminProfile = async (req, res) => {
    try {
        const adminId = req.user._id;
        const adminDetails = await userModel.findById(adminId).select("-password -__v");

        if (!adminDetails) {
            return res.json({ success: false, message: "Admin not found" });
        };

        res.json({ success: true, admin: adminDetails });
    } catch (error) {
        console.error("Get Admin Profile Error", error);
        res.json({ success: false, message: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const adminId = req.user._id;
        const { newPassword, oldPassword } = req.body;

        if (!oldPassword) {
            return res.status(400).json({ success: false, message: "Please Enter Old password" });
        };

        if (!newPassword) {
            return res.status(400).json({ success: false, message: "Please Enter New password" });
        };

        const adminDetails = await userModel.findById(adminId);
        if (!adminDetails) {
            return res.status(400).json({ success: false, message: "Admin details not found" });
        };

        const isMatch = await bcrypt.compare(oldPassword, adminDetails.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Old password is incorrect" });
        };

        const comparePassword = await bcrypt.compare(newPassword, adminDetails.password);
        if (comparePassword) {
            return res.status(400).json({ success: false, message: "Your new password must be different from your old password" });
        };

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(newPassword, salt);

        const updatePayload = {
            password: hashPassword,
            loginToken: "",
        };

        const updatePassword = await userModel.findByIdAndUpdate(
            adminDetails._id,
            { $set: updatePayload },
            { new: true },
        );
        if (!updatePassword) {
            return res.status(400).json({ success: false, message: "Password Updated Failed" });
        };

        return res.status(200).json({ success: true, message: "Password Updated Successfully" });
    } catch (error) {
        console.error("Update Password Error", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

export {
    changePassword,
    getAdminProfile,
};