import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, default: "User" },
        email: { type: String, default: "" },

        // db.users.dropIndex("email_1");
        // db.users.createIndex(
        //     { email: 1 },
        //     {
        //         unique: true,
        //         partialFilterExpression: {
        //             email: { $type: "string", $ne: "" }
        //         }
        //     }
        // )

        password: { type: String, default: "" },
        phone: { type: String, unique: true, sparse: true },
        countryCode: { type: String, default: "+91" },
        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user",
        },
        userCart: {
            type: Object,
            default: {},
        },
        orders: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "order",
            },
        ],
        addresses: [
            {
                label: { type: String, default: "Home" },
                street: { type: String, default: "" },
                city: { type: String, default: "" },
                state: { type: String, default: "" },
                zipCode: { type: String, default: "" },
                country: { type: String, default: "" },
                phone: { type: String, default: "" },
                isDefault: { type: Boolean, default: false },
                _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            },
        ],
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date },
        avatar: { type: String, default: "" },
    },
    {
        minimize: false,
        timestamps: true,
    }
);

// Index for better query performance
userSchema.index({ role: 1 });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
