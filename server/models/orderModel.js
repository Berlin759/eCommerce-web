import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    razorpayPaymentId: {
        type: String,
        default: "",
    },
    razorpayOrderId: {
        type: String,
        default: "",
    },
    razorpayRefundId: {
        type: String,
        default: "",
    },
    razorpayPaymentLinkId: {
        type: String,
        default: "",
    },
    razorpayPaymentLinkRef: {
        type: String,
        default: "",
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "product",
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
            },
            image: {
                type: String,
            },
        },
    ],
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: "INR",
    },
    address: {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            default: "",
        },
        email: {
            type: String,
            required: true,
        },
        street: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        zipcode: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
        default: "pending",
    },
    paymentMethod: {
        type: String,
        enum: ["cod", "stripe", "razorpay"],
        default: "razorpay",
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
    },
    date: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

orderSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const orderModel =
    mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
