import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "./models/userModel.js";
import "dotenv/config";

const createInitialAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);

        // Check if admin already exists
        const existingAdmin = await userModel.findOne({ role: "admin" });

        if (existingAdmin) {
            process.exit(0);
        };

        // Create admin user
        const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "123456";
        const adminName = process.env.ADMIN_NAME || "Admin";

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const adminUser = new userModel({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: "admin",
            isActive: true,
        });

        await adminUser.save();
    } catch (error) {
        console.error("Error creating admin user:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    };
};

createInitialAdmin();
