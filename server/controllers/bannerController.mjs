import bannerModel from "../models/bannerModel.js";
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

// Create banner
const createBanner = async (req, res) => {
    try {
        const { title, subtitle, description, discount, from, sale } = req.body;

        // Check if banner already exists
        const existingBanner = await bannerModel.findOne({
            title: { $regex: new RegExp(`^${title}$`, "i") },
        });

        if (existingBanner) {
            return res.status(400).json({
                success: false,
                message: "Banner already exists",
            });
        };

        let imageUrl = "";

        // Upload image to cloudinary if provided
        if (req.file) {
            try {
                const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                    folder: "orebi/banners",
                    resource_type: "image",
                    transformation: [
                        { width: 400, height: 400, crop: "fill" },
                        { quality: "auto", fetch_format: "auto" },
                    ],
                });
                imageUrl = uploadResult.secure_url;

                // Clean up temporary file
                cleanupTempFile(req.file.path);
            } catch (uploadError) {
                // Clean up temporary file on error
                if (req.file?.path) {
                    cleanupTempFile(req.file.path);
                }

                return res.status(400).json({
                    success: false,
                    message: "Failed to upload image",
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Banner image is required",
            });
        }

        const newBanner = new bannerModel({
            title: title,
            subtitle: subtitle,
            description: description,
            discount: discount,
            from: from,
            sale: sale,
            image: imageUrl,
        });

        await newBanner.save();

        return res.status(200).json({
            success: true,
            message: "Banner created successfully",
            banner: newBanner,
        });
    } catch (error) {
        console.error("Create banner error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Get all banners
const getBanners = async (req, res) => {
    try {
        const banners = await bannerModel
            .find({ isActive: true })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            banners,
        });
    } catch (error) {
        console.error("Get banners error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Get single banner
const getBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await bannerModel.findById(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }

        res.json({
            success: true,
            banner,
        });
    } catch (error) {
        console.error("Get banner error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Update banner
const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, description, discount, from, sale, isActive } = req.body;

        const banner = await bannerModel.findById(id);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }

        // Check if title is being changed and if new title already exists
        if (title && title !== banner.title) {
            const existingBanner = await bannerModel.findOne({
                title: { $regex: new RegExp(`^${title}$`, "i") },
                _id: { $ne: id },
            });

            if (existingBanner) {
                return res.status(400).json({
                    success: false,
                    message: "Banner title already exists",
                });
            }
        }

        let imageUrl = banner.image;

        // Upload new image if provided
        if (req.file) {
            try {
                // Delete old image from Cloudinary if exists
                if (banner.image) {
                    await deleteCloudinaryImage(banner.image);
                };

                // Upload new image
                const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                    folder: "orebi/banners",
                    resource_type: "image",
                    transformation: [
                        { width: 400, height: 400, crop: "fill" },
                        { quality: "auto", fetch_format: "auto" },
                    ],
                });
                imageUrl = uploadResult.secure_url;

                cleanupTempFile(req.file.path);
            } catch (uploadError) {
                if (req.file?.path) {
                    cleanupTempFile(req.file.path);
                };

                return res.status(400).json({
                    success: false,
                    message: "Failed to upload image",
                });
            };
        };

        const updatedBanner = await bannerModel.findByIdAndUpdate(
            id,
            {
                title: title || banner.title,
                subtitle: subtitle || banner.subtitle,
                description: description || banner.description,
                discount: discount || banner.discount,
                from: from || banner.from,
                sale: sale || banner.sale,
                image: imageUrl,
                isActive: isActive !== undefined ? isActive : banner.isActive,
            },
            { new: true }
        );

        res.json({
            success: true,
            message: "Banner updated successfully",
            banner: updatedBanner,
        });
    } catch (error) {
        console.error("Update banner error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    };
};

// Delete banner (soft delete)
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;

        const banner = await bannerModel.findById(id);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        };

        await bannerModel.findByIdAndUpdate(id, { isActive: false });

        res.json({
            success: true,
            message: "Banner deleted successfully",
        });
    } catch (error) {
        console.error("Delete banner error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    };
};

export { createBanner, getBanners, getBanner, updateBanner, deleteBanner };