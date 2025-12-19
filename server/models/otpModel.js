import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
        required: false,
    },
    otp: {
        type: Number,
        default: 0,
    },
    expireAt: {
        type: Date,
        default: null,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

otpSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const OTPModel = mongoose.models.otp || mongoose.model("otp", otpSchema);

export default OTPModel;
