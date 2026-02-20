import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        videoUrl: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String,
        },
        duration: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const videoModel = mongoose.model("Video", videoSchema);

export default videoModel;
