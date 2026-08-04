import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import OTPModel from "../models/otpModel.js";
import { generateOtp, sendWhatsAppOtpMeta } from "../config/general.js";
import Constants from "../constants/index.js";
import { cloudinary, deleteCloudinaryImage } from "../config/cloudinary.js";
import fs from "fs";

// Helper function to clean up temporary files
const cleanupTempFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        };
    } catch (error) {
        console.error("Error cleaning up temporary file:", error);
    };
};

const createToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone || "",
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

// Route for user login
const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User doesn't exist" });
        }

        if (!user.isActive) {
            return res.status(400).json({ success: false, message: "Account is deactivated" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            // Update last login
            user.lastLogin = new Date();
            await user.save();

            const token = createToken(user);
            return res.status(200).json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                message: "User logged in successfully",
            });
        } else {
            return res.status(400).json({ success: false, message: "Invalid credentials, try again" });
        }
    } catch (error) {
        console.error("User Login Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Route for user registration
const userRegister = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role = "user",
            address,
            isActive = true,
        } = req.body;
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Validating email format & strong password
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address", });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password length should be equal or greater than 8", });
        }

        // Only allow admin role creation if the request comes from an admin
        if (role === "admin" && (!req.user || req.user.role !== "admin")) {
            return res.status(400).json({ success: false, message: "Only admins can create admin accounts", });
        }

        // Hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            role: role,
            isActive: isActive,
            address: address || {
                street: "",
                city: "",
                state: "",
                zipCode: "",
                country: "",
                phone: "",
            },
        });

        const user = await newUser.save();

        const token = createToken(user);

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            message: "User registered successfully!",
        });
    } catch (error) {
        console.error("User Register Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Route for admin login (now uses role-based authentication)
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "User doesn't exist" });
        }

        if (user.role !== "admin") {
            return res.status(400).json({ success: false, message: "Admin access required" });
        }

        if (!user.isActive) {
            return res.status(400).json({ success: false, message: "Account is deactivated" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            // Update last login
            user.lastLogin = new Date();
            await user.save();

            const token = createToken(user);
            return res.status(200).json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                message: "Welcome admin",
            });
        } else {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Admin Login Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const removeUser = async (req, res) => {
    try {
        // First, find the user to get their avatar URL
        const user = await userModel.findById(req.body._id);

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        // Delete user's avatar from Cloudinary if exists
        if (user.avatar) {
            try {
                await deleteCloudinaryImage(user.avatar);
            } catch (error) {
                console.error("Error deleting user avatar from Cloudinary:", error);
            };
        };

        await userModel.findByIdAndDelete(req.body._id);
        return res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Removed user Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { _id, name, email, password, role, avatar, addresses, isActive } = req.body;
        const { id } = req.params;

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        if (name) user.name = name;
        if (email) {
            if (!validator.isEmail(email)) {
                return res.status(400).json({ success: false, message: "Please enter a valid email address", });
            }
            user.email = email;
        }

        if (role) {
            // Only allow admin role updates if the requesting user is admin
            if (role === "admin" && (!req.user || req.user.role !== "admin")) {
                return res.status(400).json({ success: false, message: "Only admins can assign admin role", });
            }
            user.role = role;
        }

        // Handle avatar update
        if (avatar !== undefined) {
            user.avatar = avatar;
        }

        // Handle new addresses array
        if (addresses) {
            user.addresses = addresses;
        }

        // Handle isActive field - only admins can change account status
        if (isActive !== undefined && req.user && req.user.role === "admin") {
            user.isActive = isActive;
        }

        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ success: false, message: "Password length should be equal or greater than 8", });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        return res.status(200).json({ success: true, message: "User updated successfully" });
    } catch (error) {
        console.error("Update user Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role } = req.query;
        const skip = (page - 1) * limit;

        let filter = {};
        if (role) {
            filter.role = role;
        }

        const total = await userModel.countDocuments(filter);
        const users = await userModel
            .find(filter)
            .select("-password") // Exclude password from response
            .populate("orders")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            total,
            users,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Address Management Functions

// Add new address for user
const addAddress = async (req, res) => {
    try {
        const userId = req.user?.id; // Get from auth middleware for user routes
        const paramUserId = req.params?.userId; // Get from params for admin routes
        const targetUserId = userId || paramUserId;

        const { label, street, city, state, zipCode, country, phone, isDefault } = req.body;

        // Validate required fields (phone is optional / taken from user profile)
        if (!label || !street || !city || !state || !zipCode || !country) {
            return res.status(400).json({ success: false, message: "All address fields are required (label, street, city, state, zipCode, country)", });
        };

        const user = await userModel.findById(targetUserId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        // If this is being set as default, remove default from other addresses
        if (isDefault) {
            user.addresses.forEach((addr) => (addr.isDefault = false));
        };

        // If this is the first address, make it default
        const newAddress = {
            label,
            street,
            city,
            state,
            zipCode,
            country,
            phone: phone || user.phone || "",
            isDefault: isDefault || user.addresses.length === 0,
        };

        user.addresses.push(newAddress);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Address added successfully",
            address: newAddress,
        });
    } catch (error) {
        console.error("Add Address Error", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

// Update existing address
const updateAddress = async (req, res) => {
    try {
        const userId = req.user?.id; // Get from auth middleware for user routes
        const paramUserId = req.params?.userId; // Get from params for admin routes
        const targetUserId = userId || paramUserId;
        const { addressId } = req.params;
        const { label, street, city, state, zipCode, country, phone, isDefault } =
            req.body;

        const user = await userModel.findById(targetUserId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const addressIndex = user.addresses.findIndex(
            (addr) => addr._id.toString() === addressId
        );
        if (addressIndex === -1) {
            return res.status(400).json({ success: false, message: "Address not found" });
        }

        // If setting as default, remove default from other addresses
        if (isDefault) {
            user.addresses.forEach((addr) => (addr.isDefault = false));
        }

        // Update the address
        const updatedAddress = {
            ...user.addresses[addressIndex].toObject(),
            label: label || user.addresses[addressIndex].label,
            street: street || user.addresses[addressIndex].street,
            city: city || user.addresses[addressIndex].city,
            state: state || user.addresses[addressIndex].state,
            zipCode: zipCode || user.addresses[addressIndex].zipCode,
            country: country || user.addresses[addressIndex].country,
            phone: phone !== undefined ? phone : user.addresses[addressIndex].phone,
            isDefault:
                isDefault !== undefined
                    ? isDefault
                    : user.addresses[addressIndex].isDefault,
        };

        user.addresses[addressIndex] = updatedAddress;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Address updated successfully",
            address: updatedAddress,
        });
    } catch (error) {
        console.error("Update Address Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Delete address
const deleteAddress = async (req, res) => {
    try {
        const userId = req.user?.id; // Get from auth middleware for user routes
        const paramUserId = req.params?.userId; // Get from params for admin routes
        const targetUserId = userId || paramUserId;
        const { addressId } = req.params;

        const user = await userModel.findById(targetUserId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const addressIndex = user.addresses.findIndex(
            (addr) => addr._id.toString() === addressId
        );
        if (addressIndex === -1) {
            return res.status(400).json({ success: false, message: "Address not found" });
        }

        const wasDefault = user.addresses[addressIndex].isDefault;
        user.addresses.splice(addressIndex, 1);

        // If deleted address was default and there are remaining addresses, make the first one default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Address deleted successfully",
        });
    } catch (error) {
        console.error("Delete Address Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Set default address
const setDefaultAddress = async (req, res) => {
    try {
        const userId = req.user?.id; // Get from auth middleware for user routes
        const paramUserId = req.params?.userId; // Get from params for admin routes
        const targetUserId = userId || paramUserId;
        const { addressId } = req.params;

        const user = await userModel.findById(targetUserId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const addressIndex = user.addresses.findIndex(
            (addr) => addr._id.toString() === addressId
        );
        if (addressIndex === -1) {
            return res.status(400).json({ success: false, message: "Address not found" });
        }

        // Remove default from all addresses and set the specified one as default
        user.addresses.forEach((addr) => (addr.isDefault = false));
        user.addresses[addressIndex].isDefault = true;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Default address updated successfully",
        });
    } catch (error) {
        console.error("Set Default Address Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Get user addresses
const getUserAddresses = async (req, res) => {
    try {
        const userId = req.user?.id; // Get from auth middleware for user routes
        const paramUserId = req.params?.userId; // Get from params for admin routes
        const targetUserId = userId || paramUserId;

        const user = await userModel.findById(targetUserId).select("addresses");
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            addresses: user.addresses || [],
        });
    } catch (error) {
        console.error("Get Addresses Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Avatar upload function
const uploadUserAvatar = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        };

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "orebi/users",
            resource_type: "image",
            transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
                { quality: "auto", fetch_format: "auto" },
            ],
        });

        // Clean up temporary file
        cleanupTempFile(req.file.path);

        const updateUser = await userModel.findByIdAndUpdate(userId,
            { avatar: uploadResult.secure_url },
            { new: true }
        );
        if (!updateUser) {
            return res.status(400).json({ success: false, message: "Something went Wrong, please try again later." });
        };

        return res.status(200).json({
            success: true,
            message: "Avatar uploaded successfully",
            avatarUrl: uploadResult.secure_url,
        });
    } catch (error) {
        console.error("Avatar upload error", error);

        if (req.file?.path) {
            cleanupTempFile(req.file.path);
        };

        return res.status(400).json({ success: false, message: error.message });
    };
};

const uploadAdminUserAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        };

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "orebi/users",
            resource_type: "image",
            transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
                { quality: "auto", fetch_format: "auto" },
            ],
        });

        // Clean up temporary file
        cleanupTempFile(req.file.path);

        return res.status(200).json({
            success: true,
            message: "Avatar uploaded successfully",
            avatarUrl: uploadResult.secure_url,
        });
    } catch (error) {
        console.error("Avatar upload error", error);

        if (req.file?.path) {
            cleanupTempFile(req.file.path);
        };

        return res.status(400).json({ success: false, message: error.message });
    };
};

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const user = await userModel
            .findById(req.user.id)
            .select("-password")
            .populate("orders");

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        };

        const userProfile = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || (user.addresses && user.addresses[0] ? user.addresses[0].phone : ""),
            role: user.role,
            address: user.addresses && user.addresses[0] ? user.addresses[0].street : "",
            avatar: user.avatar,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            isActive: user.isActive,
            orders: user.orders,
            addresses: user.addresses,
        };

        return res.status(200).json({ success: true, user: userProfile });
    } catch (error) {
        console.error("Get Profile Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        if (name) user.name = name;

        if (email !== undefined) {
            const trimmedEmail = String(email).trim();
            if (trimmedEmail !== "") {
                if (!validator.isEmail(trimmedEmail)) {
                    return res.status(400).json({ success: false, message: "Please enter a valid email address" });
                }

                // Check if non-empty email is already taken by another user
                const existingUser = await userModel.findOne({
                    email: trimmedEmail,
                    _id: { $ne: req.user.id },
                });
                if (existingUser) {
                    return res.status(400).json({ success: false, message: "Email is already taken by another user" });
                }

                user.email = trimmedEmail;
            } else {
                user.email = "";
            }
        }

        if (phone) {
            user.phone = phone;
            if (user.addresses && user.addresses.length > 0) {
                user.addresses[0].phone = phone;
            }
        }

        if (address) {
            if (!user.addresses || user.addresses.length === 0) {
                // Create a default address entry only if address text is provided
                user.addresses = [
                    {
                        label: "Primary",
                        street: address,
                        city: "",
                        state: "",
                        zipCode: "",
                        country: "",
                        phone: user.phone || "",
                        isDefault: true,
                    },
                ];
            } else {
                user.addresses[0].street = address;
            }
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || (user.addresses && user.addresses[0] ? user.addresses[0].phone : ""),
                address: user.addresses && user.addresses[0] ? user.addresses[0].street : "",
                avatar: user.avatar,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Update Profile Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const changeUserPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        };

        if (!oldPassword) {
            return res.status(400).json({ success: false, message: "Please Enter Old Password" });
        };

        if (!newPassword) {
            return res.status(400).json({ success: false, message: "Please Enter New Password" });
        };

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid old password. Please try again." });
        };

        if (oldPassword === newPassword) {
            return res.status(400).json({ success: false, message: "New password cannot be same as old password. Please try another password." });
        };

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const updateUser = await userModel.findByIdAndUpdate(userId,
            { password: hashedPassword },
            { new: true }
        );
        if (!updateUser) {
            return res.status(400).json({ success: false, message: "Something went Wrong, please try again later." });
        };

        return res.status(200).json({
            success: true,
            message: "Password updated successfully.",
            user: {
                id: updateUser._id,
                name: updateUser.name,
                email: updateUser.email,
                role: updateUser.role,
                phone: updateUser.addresses && updateUser.addresses[0] ? updateUser.addresses[0].phone : "",
                address: updateUser.addresses && updateUser.addresses[0] ? updateUser.addresses[0].street : "",
                avatar: updateUser.avatar,
                createdAt: updateUser.createdAt,
            },
        });
    } catch (error) {
        console.error("Update Password Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1, size } = req.body;
        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const cartKey = size ? `${productId}_${size}` : productId;

        if (user.userCart[cartKey]) {
            user.userCart[cartKey] += quantity;
        } else {
            user.userCart[cartKey] = quantity;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Item added to cart",
            cart: user.userCart,
        });
    } catch (error) {
        console.error("Add to Cart Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Update cart item
const updateCart = async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;
        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const cartKey = size ? `${productId}_${size}` : productId;

        if (quantity <= 0) {
            delete user.userCart[cartKey];
        } else {
            user.userCart[cartKey] = quantity;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            cart: user.userCart,
        });
    } catch (error) {
        console.error("Update Cart Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Get user cart
const getUserCart = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            cart: user.userCart || {},
        });
    } catch (error) {
        console.error("Get Cart Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Clear user cart
const clearCart = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        user.userCart = {};
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
        });
    } catch (error) {
        console.error("Clear Cart Error", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Create admin user (only accessible by existing admins)
const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if requesting user is admin
        if (req.user.role !== "admin") {
            return res.status(400).json({ success: false, message: "Admin access required" });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address", });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password length should be equal or greater than 8", });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = new userModel({
            name,
            email,
            password: hashedPassword,
            role: "admin",
        });

        const admin = await newAdmin.save();

        return res.status(200).json({
            success: true,
            message: "Admin created successfully!",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error("Create Admin Error", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

// Route for sending Phone OTP via Meta WhatsApp
const sendPhoneOtp = async (req, res) => {
    try {
        const { phone, countryCode = "+91" } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: "Please enter your phone number" });
        }

        const cleanPhone = String(phone).trim();
        // Validation: Ensure input contains only digits
        if (!/^\d+$/.test(cleanPhone)) {
            return res.status(400).json({ success: false, message: "Phone number must contain numbers only" });
        }

        // Validation based on country code
        if (countryCode === "+91" && cleanPhone.length !== 10) {
            return res.status(400).json({ success: false, message: "India (+91) phone number must be exactly 10 digits" });
        } else if (cleanPhone.length < 7 || cleanPhone.length > 15) {
            return res.status(400).json({ success: false, message: "Invalid phone number length for the selected country code" });
        }

        const fullPhone = `${countryCode}${cleanPhone}`;

        // Check if user exists with this phone number; if not, create new user entry
        let user = await userModel.findOne({
            phone: cleanPhone,
        });

        if (!user) {
            const dateDigits = Date.now().toString().slice(0, 4);
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            const generatedName = `User${dateDigits}${randomDigits}`;

            user = new userModel({
                name: generatedName,
                phone: cleanPhone,
                countryCode,
                email: "",
                password: "",
                role: "user",
            });
            await user.save();
        }

        // Generate 6-digit OTP
        const otp = await generateOtp();
        const expirationMs = Constants.OTP_EXPIRATION_TIME || 10 * 60 * 1000;
        const expireAt = new Date(Date.now() + expirationMs);

        // Delete previous unverified OTPs for this user
        await OTPModel.deleteMany({ userId: user._id });

        // Save new OTP in database
        await OTPModel.create({
            userId: user._id,
            otp: otp,
            expireAt: expireAt,
        });

        // Send Meta WhatsApp OTP
        const sendResult = await sendWhatsAppOtpMeta(fullPhone, otp);

        if (!sendResult.success) {
            return res.status(400).json({ success: false, message: sendResult.message });
        }

        return res.status(200).json({
            success: true,
            message: sendResult.message || "OTP sent to your WhatsApp number successfully",
            devOtp: sendResult.devOtp,
        });
    } catch (error) {
        console.error("Send Phone OTP Error:", error);
        return res.status(400).json({ success: false, message: error.message || "Failed to send OTP" });
    }
};

// Route for verifying Phone OTP and logging in
const verifyPhoneOtp = async (req, res) => {
    try {
        const { phone, countryCode = "+91", otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: "Phone number and OTP are required" });
        }

        const cleanPhone = String(phone).trim();
        const fullPhone = `${countryCode}${cleanPhone}`;

        const user = await userModel.findOne({
            phone: cleanPhone,
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found with this phone number" });
        }

        const otpRecord = await OTPModel.findOne({
            userId: user._id,
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "No OTP request found for this number" });
        }

        if (parseInt(otpRecord.otp) !== parseInt(otp)) {
            return res.status(400).json({ success: false, message: "Invalid OTP. Please check and try again." });
        }

        if (otpRecord.expireAt && new Date(otpRecord.expireAt).getTime() < Date.now()) {
            return res.status(400).json({ success: false, message: "Your OTP has expired. Please request a new one." });
        }

        // OTP verified - clean up OTP records
        await OTPModel.deleteMany({ userId: user._id });

        // Update user last login time
        user.lastLogin = new Date();
        await user.save();

        const token = createToken(user);

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
            },
            message: "User logged in successfully!",
        });
    } catch (error) {
        console.error("Verify Phone OTP Error:", error);
        return res.status(400).json({ success: false, message: error.message || "OTP verification failed" });
    }
};

export {
    userLogin,
    userRegister,
    sendPhoneOtp,
    verifyPhoneOtp,
    adminLogin,
    getUsers,
    removeUser,
    updateUser,
    getUserProfile,
    updateUserProfile,
    changeUserPassword,
    addToCart,
    updateCart,
    getUserCart,
    clearCart,
    createAdmin,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getUserAddresses,
    uploadUserAvatar,
    uploadAdminUserAvatar,
};