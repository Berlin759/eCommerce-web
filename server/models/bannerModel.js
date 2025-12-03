import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    subtitle: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    discount: {
        type: String,
        required: true,
        trim: true,
    },
    from: {
        type: Number,
        required: true,
        trim: true,
    },
    sale: {
        type: String,
        required: true,
        trim: true,
    },
    image: {
        type: String,
        default: "",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const bannerModel = mongoose.models.banner || mongoose.model("banner", bannerSchema);

export default bannerModel;
