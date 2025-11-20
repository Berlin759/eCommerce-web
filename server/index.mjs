import "dotenv/config";
import express from "express";
const app = express();
import cors from "cors";
import http from "http";
import { fileURLToPath } from "url";
import path from "path";
import { readdirSync } from "fs";
import dbConnect from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

const port = process.env.PORT;

const httpServer = http.createServer(app);

const allowedOrigins = [
    process.env.ADMIN_URL,
    process.env.CLIENT_URL,
    // Add production URLs
    // Add localhost for development
    "http://localhost:5174",
    "http://localhost:5173",
    "http://localhost:8081", // iOS simulator
    "http://10.0.2.2:8081", // Android emulator
    "http://10.0.2.2:8000", // Android emulator direct access
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);

            if (process.env.NODE_ENV === "development") {
                return callback(null, true);
            };

            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            };
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);
app.use(express.json());

// dbConnect();
connectCloudinary();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesPath = path.resolve(__dirname, "./routes");
const routeFiles = readdirSync(routesPath);
routeFiles.map(async (file) => {
    const routeModule = await import(`./routes/${file}`);
    app.use("/", routeModule.default);
});

app.get("/", (req, res) => {
    res.send("You should not be here");
});

// app.listen(port, () => {
//     console.log(`Server is running on ${port}`);
// });

dbConnect().then(() => {
    httpServer.listen(port, () => {
        console.log("Server is running on PORT ----->", port);
        console.log("Server URL ----->", process.env.SERVER_URL);
    });
}).catch((error) => {
    console.log("Error in connecting to database ----->", error);
    return process.exit(1);
});