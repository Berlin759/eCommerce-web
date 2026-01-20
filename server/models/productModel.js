import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        _type: { type: String },
        name: { type: String, required: true },
        images: { type: Array, required: true },
        mrp: { type: Number, required: true },
        price: { type: Number, required: true },
        discountedPercentage: { type: Number, required: true, default: 0 },
        stock: { type: Number, required: true, default: 0 },
        soldQuantity: { type: Number, default: 0 },
        category: { type: String, required: true },
        brand: { type: String, default: "" },
        badge: { type: Boolean },
        isAvailable: { type: Boolean },
        offer: { type: Boolean },
        description: { type: String, required: true },
        tags: { type: Array },
    },
    {
        timestamps: true,
    }
);

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
