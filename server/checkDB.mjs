import "dotenv/config";
import mongoose from "mongoose";

const checkDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to database");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    };
};

checkDatabase();
