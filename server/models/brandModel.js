import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    image: {
        type: String,
        default: "",
    },
    description: {
        type: String,
        default: "",
    },
    website: {
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

const brandModel =
    mongoose.models.brand || mongoose.model("brand", brandSchema);

export default brandModel;
