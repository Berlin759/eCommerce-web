import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        discountedPercentage: {
            type: Number,
            default: 0,
        },
        maintenanceMode: {
            type: Boolean,
            default: false,
        },
        maintenanceMessage: {
            type: String,
            default: "We are currently performing scheduled maintenance. Please check back later.",
        },
    },
    {
        minimize: false,
        timestamps: true,
    }
);

const settingModel = mongoose.models.setting || mongoose.model("setting", settingSchema);

export default settingModel;
