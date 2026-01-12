import crypto from "crypto";
import axios from "axios";
import fs from "fs";
import path from "path";
import Constants from "../constants/index.js";
import messages from "./messages.js";

const __dirname = path.resolve();
const BASE_URL = process.env.SERVER_URL;

export const errorResponse = (msg = "", data = {}) => {
    return {
        flag: 0,
        msg: msg.length == 0 ? "Error" : msg,
        data: data,
        status: 400,
    };
};

export const successResponse = (msg = "", data = {}) => {
    return {
        flag: 1,
        msg: msg.length == 0 ? "Success" : msg,
        data: data,
        status: 200,
    };
};

export const warningResponse = (msg = "", data = {}) => {
    return {
        flag: 2,
        msg: msg.length == 0 ? "Warning" : msg,
        data: data,
    };
};

export const twoFAEnabledResponse = (msg = "", data = {}) => {
    return {
        flag: 3,
        msg: msg.length == 0 ? "2FA is Enabled" : msg,
        data: data,
    };
};

export const authErrorResponse = (msg = "", data = {}) => {
    return {
        flag: 8,
        msg: msg.length == 0 ? "Session Expired!" : msg,
        data: data,
        status: 401,
    };
};

export const maintenanceErrorResponse = (msg = "", data = {}) => {
    return {
        flag: 9,
        msg: msg.length == 0 ? "Service unavailable due to maintenance" : msg,
        data: data,
        status: 503,
    };
};

export const log1 = (msg) => {
    const d = new Date();
    console.log("[" + d.toLocaleString() + " " + d.getMilliseconds() + "] :", msg);
};

export const generateOtp = async () => {
    try {
        const otp = crypto.randomInt(100000, 999999);

        return otp;
    } catch (error) {
        log1(["Error in generateOtp ----->", error]);
        return "";
    };
};

export const maskEmail = (email) => {
    const [username, domain] = email.split("@");

    if (username.length <= 4) {
        return email;
    };

    const firstTwo = username.slice(0, 2);
    const lastTwo = username.slice(-2);

    return `${firstTwo}***${lastTwo}@${domain}`;
};

export const getTimeFormatFromMilliseconds = (milliseconds) => {
    if (milliseconds < 0) {
        return "Expired";
    } else if (milliseconds < (1000 * 60)) {
        return `${Math.floor(milliseconds / 1000)} seconds`;
    } else if (milliseconds < (1000 * 60 * 60)) {
        return `${Math.floor(milliseconds / (1000 * 60))} minutes`;
    } else if (milliseconds < (1000 * 60 * 60 * 24)) {
        return `${Math.floor(milliseconds / (1000 * 60 * 60))} hours`;
    } else if (milliseconds < (1000 * 60 * 60 * 24 * 30)) {
        return `${Math.floor(milliseconds / (1000 * 60 * 60 * 24))} days`;
    } else if (milliseconds < (1000 * 60 * 60 * 24 * 365)) {
        return `${Math.floor(milliseconds / (1000 * 60 * 60 * 24 * 30))} months`;
    } else {
        return `${Math.floor(milliseconds / (1000 * 60 * 60 * 24 * 365))} years`;
    };
};

export const ip2location = async (ipAddress) => {
    const data = { ipAddress: ipAddress };

    try {
        const url = `https://ipwho.is/${ipAddress}`;
        const response = await axios.get(url, { headers: { Accept: 'application/json' } });

        const location = response.data;

        data.country = location.country || "Unknown";
        data.region = location.region || "Unknown";
        data.city = location.city || "Unknown";

        return successResponse("", data);
    } catch (error) {
        log1(["Error fetching ip2location----->", error]);
        return errorResponse("", data);
    };
};

export const getAddressFromLatLng = async (lat, lng) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    try {
        const response = await axios.get(url, { headers: { Accept: 'application/json' } });
        const data = response.data;
        log1(["getAddressFromLatLng data ----->", data]);
        if (data.status === "OK" && data.results.length > 0) {
            return successResponse('Address details.', { result: data.results[0] });
        } else {
            return errorResponse("Address not found.");
        }
    } catch (error) {
        log1(["Error in getAddressFromLatLng ----->", error]);
        return errorResponse(messages.unexpectedDataError);
    }
}

export const uploadProfileImage = async (file) => {
    try {
        const filePath = path.join('assets', 'uploads', 'profiles');
        const fileName = generateFileName(file.name);

        await fs.mkdir(filePath, { recursive: true });

        await file.mv(`${filePath}/${fileName}`);

        return successResponse('Profile image uploaded successfully.', { fileName: fileName });
    } catch (error) {
        log1(["Error in uploadProfileImage ----->", error]);
        return errorResponse(messages.unexpectedDataError);
    };
};

export const removeProfileImage = async (fileName) => {
    try {
        const filePath = path.join('assets', 'uploads', 'profiles', fileName);

        await fs.access(filePath);

        await fs.unlink(filePath);

        return successResponse("Profile image removed successfully.");
    } catch (error) {

        if (error.code === 'ENOENT') {
            return successResponse('File not found, treated as already removed');
        };

        log1(["Error in removeProfileImage ----->", error]);
        return errorResponse(messages.unexpectedDataError);
    };
};

/**
 * Uploads any type of file (image, video, document, etc.)
 * and stores it in the correct folder under /uploads/
 *
 * @param {Object} file - Uploaded file object (from express-fileupload)
 * @param {Object} options
 * @param {number} [options.maxSizeMB] - Max allowed size in MB
 */
export const uploadFile = async (file, maxSizeMB = Constants.MAX_FILE_SIZE) => {
    try {
        if (!file) return errorResponse("No file provided.");

        const ext = path.extname(file.name).toLowerCase();
        const mime = file.mimetype.toLowerCase();

        const typeGroups = {
            images: {
                pattern: /jpeg|jpg|png|gif|webp/,
                mimes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
                folder: "images",
            },
            videos: {
                pattern: /mp4|mov|avi|mkv|webm|flv|wmv/,
                mimes: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm", "video/x-flv", "video/x-ms-wmv"],
                folder: "videos",
            },
            documents: {
                pattern: /pdf|doc|docx|xls|xlsx|ppt|pptx|txt/,
                mimes: [
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/vnd.ms-excel",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/vnd.ms-powerpoint",
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    "text/plain",
                ],
                folder: "documents",
            },
            audio: {
                pattern: /mp3|wav|aac|ogg|flac/,
                mimes: ["audio/mpeg", "audio/wav", "audio/aac", "audio/ogg", "audio/flac"],
                folder: "audio",
            },
        };

        let folder = "others";
        for (const key in typeGroups) {
            const type = typeGroups[key];
            if ((type.pattern.test(ext) || type.pattern.test(mime)) && type.mimes.includes(mime)) {
                folder = type.folder;
                break;
            };
        };

        if (folder === "others") {
            return errorResponse(`Unsupported file format. Please upload a valid ${folder} file.`);
        };

        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            return errorResponse(`${folder} File size exceeds the maximum limit of ${maxSizeMB} MB.`);
        };

        const rootDir = path.join(__dirname, "..");
        const uploadDir = path.join(rootDir, "uploads", folder);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        };

        const fileName = generateFileName(file.name);
        const finalPath = path.join(uploadDir, fileName);
        await file.mv(finalPath);

        const publicUrl = `${BASE_URL}/${folder}/${fileName}`;

        return successResponse("File uploaded successfully.", {
            fileName,
            folder,
            fullPath: finalPath,
            url: publicUrl,
        });
    } catch (error) {
        log1(["Error in uploadFile ----->", error]);
        return errorResponse(messages.unexpectedDataError);
    };
};

/**
 * Remove uploaded file by folder and name.
 * @param {string} folder - Subfolder name (e.g. "videos", "images")
 * @param {string} fileName - File name to delete
 */
export const removeFile = async (folder, fileName) => {
    try {
        if (!folder || !fileName) return;

        const rootDir = path.join(__dirname, "..");
        const filePath = path.join(rootDir, "uploads", folder, fileName);

        await fs.promises.access(filePath);
        await fs.promises.unlink(filePath);

        return successResponse("File removed successfully.");
    } catch (error) {
        if (error.code === "ENOENT") {
            return successResponse("File not found, treated as already removed.");
        };

        log1(["Error in removeFile ----->", error]);
        return errorResponse(messages.unexpectedDataError);
    };
};

export const getIpAddress = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    let ipAddress = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
    ipAddress = ipAddress.startsWith("::ffff:") ? ipAddress.replace("::ffff:", "") : ipAddress;

    return ipAddress;
};

export const convertToTodayTime = (timeStr) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;

    const now = new Date();
    now.setHours(hours, minutes, 0, 0);
    return now;
};

export const sendOtpOnWhatsApp = async (mobile, otp) => {
    try {
        const url = `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat`;

        const messageData = {
            token: process.env.ULTRAMSG_TOKEN,
            to: mobile,
            body: `Your OTP is ${otp}. It will expire in ${Constants.OTP_EXPIRATION_TIME} minutes.`
        };

        const res = await axios.post(url, messageData);

        return {
            success: true,
            message: "OTP sent to your WhatsApp Number Successfully",
        };
    } catch (error) {
        log1(["Error fetching sendOtpOnWhatsApp-------->", error.response?.data || error.message]);
        return {
            success: false,
            message: "Failed to send OTP",
        };
    };
};

export const calculateDiscountedPercentage = (firstPrice, secondPrice) => {
    if (firstPrice <= 0) return 0;

    const discountPercentage = Math.round(((firstPrice - secondPrice) / firstPrice) * 100);

    return discountPercentage;
};

export const createSlug = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-");
};

export const generateOrderId = () => {
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `ORDER-${Date.now()}-${random}`;
}

export const getTomorrowInTimezone = (timeZone) => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });

    const parts = formatter.formatToParts(new Date());
    const y = Number(parts.find(p => p.type === "year").value);
    const m = Number(parts.find(p => p.type === "month").value);
    const d = Number(parts.find(p => p.type === "day").value);

    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + 1);

    return date.toISOString().split("T")[0];
};