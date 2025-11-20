import mongoose from "mongoose";

const dbConnect = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected successfully");
    } catch (error) {
        console.error(`Error: ${error.message}`);
        throw error;
        // process.exit(1);
    }
};

export default dbConnect;
