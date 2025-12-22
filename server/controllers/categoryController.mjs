import categoryModel from "../models/categoryModel.js";
import { cloudinary, deleteCloudinaryImage } from "../config/cloudinary.js";
import { createSlug } from "../config/general.js";
import fs from "fs";

// Helper function to clean up temporary files
const cleanupTempFile = (filePath) => {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        };
    } catch (error) {
        console.error("Error cleaning up temporary file:", error);
    };
};

// Create category
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const existingCategory = await categoryModel.findOne({
            // name: { $regex: new RegExp(`^${name}$`, "i") },
            name: name,
            isActive: true,
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category already exists",
            });
        };

        // let imageUrl = "";

        // if (req.file) {
        //     try {
        //         const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        //             folder: "orebi/categories",
        //             resource_type: "image",
        //             transformation: [
        //                 { width: 400, height: 400, crop: "fill" },
        //                 { quality: "auto", fetch_format: "auto" },
        //             ],
        //         });
        //         imageUrl = uploadResult.secure_url;

        //         cleanupTempFile(req.file.path);
        //     } catch (uploadError) {
        //         if (req.file?.path) {
        //             cleanupTempFile(req.file.path);
        //         };

        //         return res.status(400).json({
        //             success: false,
        //             message: "Failed to upload image",
        //         });
        //     };
        // } else {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Category image is required",
        //     });
        // };

        const newCategory = new categoryModel({
            name: name,
            slug: createSlug(name),
            // image: imageUrl,
            // description: description || "",
        });

        await newCategory.save();

        return res.status(200).json({
            success: true,
            message: "Category created successfully",
            category: newCategory,
        });
    } catch (error) {
        console.error("Create category error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    };
};

// Get all categories
const getCategories = async (req, res) => {
    try {
        const categories = await categoryModel
            .find({ isActive: true })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            categories,
        });
    } catch (error) {
        console.error("Get categories error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Get single category
const getCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await categoryModel.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        return res.status(200).json({
            success: true,
            category,
        });
    } catch (error) {
        console.error("Get category error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;

        const category = await categoryModel.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Check if name is being changed and if new name already exists
        if (name && name !== category.name) {
            const existingCategory = await categoryModel.findOne({
                name: { $regex: new RegExp(`^${name}$`, "i") },
                _id: { $ne: id },
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Category name already exists",
                });
            }
        }

        // let imageUrl = category.image;

        // Upload new image if provided
        // if (req.file) {
        //     try {
        //         // Delete old image from Cloudinary if exists
        //         if (category.image) {
        //             await deleteCloudinaryImage(category.image);
        //         };

        //         // Upload new image
        //         const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        //             folder: "orebi/categories",
        //             resource_type: "image",
        //             transformation: [
        //                 { width: 400, height: 400, crop: "fill" },
        //                 { quality: "auto", fetch_format: "auto" },
        //             ],
        //         });
        //         imageUrl = uploadResult.secure_url;

        //         // Clean up temporary file
        //         cleanupTempFile(req.file.path);
        //     } catch (uploadError) {
        //         // Clean up temporary file on error
        //         if (req.file?.path) {
        //             cleanupTempFile(req.file.path);
        //         }

        //         return res.status(400).json({
        //             success: false,
        //             message: "Failed to upload image",
        //         });
        //     }
        // }

        const categoryName = name || category.name;
        const slugName = createSlug(categoryName);

        const updatedCategory = await categoryModel.findByIdAndUpdate(
            id,
            {
                name: name || category.name,
                slug: slugName,
                // image: imageUrl,
                // description:
                //     description !== undefined ? description : category.description,
                isActive: isActive !== undefined ? isActive : category.isActive,
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category: updatedCategory,
        });
    } catch (error) {
        console.error("Update category error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Delete category (soft delete)
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await categoryModel.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        await categoryModel.findByIdAndUpdate(id, { isActive: false });

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        console.error("Delete category error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
};
