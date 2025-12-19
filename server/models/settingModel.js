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
    },
    {
        minimize: false,
        timestamps: true,
    }
);

const settingModel = mongoose.models.setting || mongoose.model("setting", settingSchema);

export default settingModel;
