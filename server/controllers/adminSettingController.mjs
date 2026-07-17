import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import settingModel from "../models/settingModel.js";

const getAdminProfile = async (req, res) => {
    try {
        const adminId = req.user._id;
        const adminDetails = await userModel.findById(adminId).select("-password -__v");

        if (!adminDetails) {
            return res.status(400).json({ success: false, message: "Admin not found" });
        };

        return res.status(200).json({ success: true, admin: adminDetails });
    } catch (error) {
        console.error("Get Admin Profile Error", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

const getSettingDetails = async (req, res) => {
    try {
        const adminId = req.user._id;
        if (!adminId) {
            return res.status(400).json({ success: false, message: "Admin not found" });
        };

        const settingDetails = await settingModel.findOne({ adminId: adminId });

        if (!settingDetails) {
            return res.status(400).json({ success: false, message: "Setting Details not found" });
        };

        return res.status(200).json({ success: true, setting: settingDetails });
    } catch (error) {
        console.error("Get Setting Details Error", error);
        return res.status(400).json({ success: false, message: error.message });
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

const updateDiscountedPercentage = async (req, res) => {
    try {
        const adminId = req.user._id;
        const { discountedPercentage } = req.body;

        if (!discountedPercentage || discountedPercentage === "") {
            return res.status(400).json({ success: false, message: "Please Enter Discounted Percentage" });
        };

        const adminDetails = await userModel.findById(adminId);
        if (!adminDetails) {
            return res.status(400).json({ success: false, message: "Admin details not found" });
        };

        const updatePayload = {
            discountedPercentage: discountedPercentage,
        };

        const updateDisPercentage = await settingModel.findOneAndUpdate(
            { adminId: adminDetails._id },
            { $set: updatePayload },
            { new: true },
        );
        if (!updateDisPercentage) {
            return res.status(400).json({ success: false, message: "Discount Percentage Update Failed" });
        };

        return res.status(200).json({ success: true, message: "Discount Percentage Update Successfully" });
    } catch (error) {
        console.error("Discount Percentage Error", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

const toggleMaintenanceMode = async (req, res) => {
    try {
        const adminId = req.user._id;
        const { maintenanceMode, maintenanceMessage } = req.body;

        const adminDetails = await userModel.findById(adminId);
        if (!adminDetails) {
            return res.status(400).json({ success: false, message: "Admin details not found" });
        };

        const updatePayload = {};
        if (typeof maintenanceMode === "boolean") {
            updatePayload.maintenanceMode = maintenanceMode;
        }
        if (maintenanceMessage !== undefined) {
            updatePayload.maintenanceMessage = maintenanceMessage;
        };

        const updated = await settingModel.findOneAndUpdate(
            { adminId: adminDetails._id },
            { $set: updatePayload },
            { new: true },
        );
        if (!updated) {
            return res.status(400).json({ success: false, message: "Maintenance mode update failed" });
        };

        return res.status(200).json({
            success: true,
            message: `Maintenance mode ${updated.maintenanceMode ? "enabled" : "disabled"}`,
            setting: {
                maintenanceMode: updated.maintenanceMode,
                maintenanceMessage: updated.maintenanceMessage,
            },
        });
    } catch (error) {
        console.error("Toggle Maintenance Mode Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const getMaintenanceStatus = async (req, res) => {
    try {
        const setting = await settingModel.findOne().sort({ createdAt: -1 });

        if (!setting) {
            return res.status(200).json({
                success: true,
                maintenanceMode: false,
                maintenanceMessage: "",
            });
        };

        return res.status(200).json({
            success: true,
            maintenanceMode: setting.maintenanceMode || false,
            maintenanceMessage: setting.maintenanceMessage || "",
        });
    } catch (error) {
        console.error("Get Maintenance Status Error", error);
        return res.status(200).json({
            success: true,
            maintenanceMode: false,
            maintenanceMessage: "",
        });
    }
};

export {
    getAdminProfile,
    getSettingDetails,
    changePassword,
    updateDiscountedPercentage,
    toggleMaintenanceMode,
    getMaintenanceStatus,
};