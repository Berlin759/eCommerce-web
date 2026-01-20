import { ObjectId } from "mongodb";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { deleteCloudinaryImage } from "../config/cloudinary.js";
import { calculateDiscountedPercentage } from "../config/general.js";
import productModel from "../models/productModel.js";
import ratingModel from "../models/ratingModel.js";

const cleanupTempFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        };
    } catch (error) {
        console.error("Error cleaning up temporary file:", error);
    };
};

const addProduct = async (req, res) => {
    try {
        const {
            _type,
            name,
            mrp,
            price,
            discountedPercentage,
            stock,
            category,
            // brand,
            badge,
            isAvailable,
            offer,
            description,
            tags,
        } = req.body;
        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        if (!name || !mrp || !price || !category || !description) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, mrp, price, category, and description are mandatory.",
            });
        };

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                try {
                    let result = await cloudinary.uploader.upload(item.path, {
                        folder: "orebi/products",
                        resource_type: "image",
                        transformation: [
                            { width: 800, height: 800, crop: "fill" },
                            { quality: "auto", fetch_format: "auto" },
                        ],
                    });

                    cleanupTempFile(item.path);

                    return result.secure_url;
                } catch (error) {
                    cleanupTempFile(item.path);
                    throw error;
                }
            })
        );

        let parsedTags;
        try {
            parsedTags = JSON.parse(tags);
        } catch (err) {
            parsedTags = tags ? tags.split(",").map((tag) => tag.trim()) : [];
        };

        const discountPercentage = calculateDiscountedPercentage(Number(mrp), Number(price));

        const productData = {
            _type: _type ? _type : "",
            name,
            mrp: Number(mrp),
            price: Number(price),
            discountedPercentage: discountPercentage ? Number(discountPercentage) : 0,
            stock: stock ? Number(stock) : 0,
            soldQuantity: 0,
            category,
            // brand: brand ? brand : "",
            badge: badge === "true" ? true : false,
            isAvailable: isAvailable === "true" ? true : false,
            offer: offer === "true" ? true : false,
            description,
            tags: tags ? parsedTags : [],
            images: imagesUrl,
        };

        const product = new productModel(productData);
        product.save();

        return res.status(200).json({
            success: true,
            message: `${name} added successfully`,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

const listProducts = async (req, res) => {
    try {
        const {
            _type,
            _id,
            _search,
            brand,
            category,
            offer,
            onSale,
            isAvailable,
            _page = 1,
            _perPage = 25,
        } = req.query;

        if (_id) {
            const dbProduct = await productModel.findById(_id);
            if (dbProduct) {
                const formattedProduct = {
                    ...dbProduct.toObject(),
                    image: dbProduct.images && dbProduct.images.length > 0 ? dbProduct.images[0] : "",
                };

                return res.status(200).json({ success: true, product: formattedProduct });
            } else {
                return res.status(400).json({ success: false, message: "Product not found" });
            };
        };

        let filter = {};

        if (isAvailable !== "false") {
            filter.isAvailable = true;
        };

        if (_type) {
            filter._type = _type;
        };

        if (brand) {
            filter.brand = brand;
        };

        if (category) {
            filter.category = category;
        };

        if (offer === "true") {
            filter.offer = true;
        };

        if (onSale === "true") {
            filter.onSale = true;
        };

        if (_search) {
            const searchRegex = new RegExp(_search, "i");
            filter.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { tags: { $in: [searchRegex] } },
            ];
        };

        let dbProducts = await productModel.find(filter).sort({ createdAt: -1 });

        const productRatings = await ratingModel.aggregate([
            {
                $group: {
                    _id: "$productId",
                    averageRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 },
                },
            },
        ]);

        const ratingsMap = {};

        productRatings.forEach((r) => {
            ratingsMap[r._id.toString()] = {
                averageRating: Number(r.averageRating.toFixed(1)),
                totalRatings: r.totalRatings,
            };
        });

        const productsWithRating = dbProducts.map((product) => {
            const ratingData = ratingsMap[product._id.toString()] || {
                averageRating: 0,
                totalRatings: 0,
            };

            return {
                ...product.toObject(),
                image: product.images && product.images.length > 0 ? product.images[0] : "",
                averageRating: ratingData.averageRating,
                totalRatings: ratingData.totalRatings,
            };
        });

        // let formattedDbProducts = dbProducts.map((product) => ({
        //     ...product.toObject(),
        //     image: product.images && product.images.length > 0 ? product.images[0] : "",
        // }));

        // Apply pagination
        const page = parseInt(_page, 10) || 1;
        const perPage = parseInt(_perPage, 10) || 25;
        const startIndex = (page - 1) * perPage;
        const endIndex = page * perPage;
        const paginatedProducts = productsWithRating.slice(startIndex, endIndex);

        // Return response based on whether pagination is requested
        if (_page || _perPage) {
            return res.status(200).json({
                success: true,
                products: paginatedProducts,
                currentPage: page,
                perPage,
                totalItems: productsWithRating.length,
                totalPages: Math.ceil(productsWithRating.length / perPage),
            });
        } else {
            return res.status(200).json({
                success: true,
                products: productsWithRating,
                total: productsWithRating.length,
            });
        };
    } catch (error) {
        console.error("List products error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

const removeProduct = async (req, res) => {
    try {
        const product = await productModel.findById(req.body._id);

        if (!product) {
            return res.status(400).json({ success: false, message: "Product not found" });
        };

        if (product.images && Array.isArray(product.images)) {
            for (const imageUrl of product.images) {
                try {
                    await deleteCloudinaryImage(imageUrl);
                } catch (error) {
                    console.error("Error deleting product image from Cloudinary:", error);
                };
            };
        };

        await productModel.findByIdAndDelete(req.body._id);

        return res.status(200).json({ success: true, message: "Product removed successfully" });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Single product
const singleProducts = async (req, res) => {
    try {
        const productId = req.body._id || req.query._id || req.params.id;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required",
            });
        };

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(400).json({
                success: false,
                message: "Product not found",
            });
        };

        // Only return available products for non-admin requests
        if (!product.isAvailable && !req.user?.role === "admin") {
            return res.status(400).json({
                success: false,
                message: "Product not available",
            });
        };

        const ratingStats = await ratingModel.aggregate([
            { $match: { productId: new ObjectId(productId) } },
            {
                $group: {
                    _id: "$productId",
                    averageRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 },
                },
            },
        ]);

        const ratingData = ratingStats[0] || {
            averageRating: 0,
            totalRatings: 0,
        };

        product["averageRating"] = ratingData.averageRating;
        product["totalRatings"] = ratingData.totalRatings;

        return res.status(200).json({ success: true, product: product });
    } catch (error) {
        console.error("Single product error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

// Update stock after purchase
const updateStock = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Product ID and valid quantity are required",
            });
        };

        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(400).json({
                success: false,
                message: "Product not found",
            });
        };

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock available",
            });
        };

        product.stock -= quantity;
        product.soldQuantity += quantity;

        if (product.stock === 0) {
            product.isAvailable = false;
        };

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Stock updated successfully",
            product: {
                _id: product._id,
                stock: product.stock,
                soldQuantity: product.soldQuantity,
                isAvailable: product.isAvailable,
            },
        });
    } catch (error) {
        console.error("Update stock error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const {
            _type,
            name,
            mrp,
            price,
            discountedPercentage,
            stock,
            category,
            // brand,
            badge,
            isAvailable,
            offer,
            description,
            tags,
        } = req.body;

        const image1 = req.files?.image1 && req.files.image1[0];
        const image2 = req.files?.image2 && req.files.image2[0];
        const image3 = req.files?.image3 && req.files.image3[0];
        const image4 = req.files?.image4 && req.files.image4[0];

        const existingProduct = await productModel.findById(productId);
        if (!existingProduct) {
            return res.status(400).json({
                success: false,
                message: "Product not found",
            });
        };

        if (!name || !mrp || !price || !category || !description) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, mrp, price, category, and description are mandatory.",
            });
        };

        let imagesUrl = existingProduct.images;

        const newImages = [image1, image2, image3, image4].filter((item) => item !== undefined);

        if (newImages.length > 0) {
            try {
                const uploadPromises = newImages.map(async (item, index) => {
                    const result = await cloudinary.uploader.upload(item.path, {
                        folder: "orebi/products",
                        resource_type: "image",
                        transformation: [
                            { width: 800, height: 800, crop: "fill" },
                            { quality: "auto", fetch_format: "auto" },
                        ],
                    });

                    cleanupTempFile(item.path);

                    return { index, url: result.secure_url };
                });

                const uploadResults = await Promise.all(uploadPromises);

                uploadResults.forEach(({ index, url }) => {
                    if (index < imagesUrl.length) {
                        imagesUrl[index] = url;
                    } else {
                        imagesUrl.push(url);
                    };
                });
            } catch (error) {
                console.error("Error uploading images:", error);
                newImages.forEach((item) => cleanupTempFile(item.path));

                return res.status(500).json({
                    success: false,
                    message: "Error uploading images",
                });
            };
        };

        // Parse tags
        let parsedTags;
        try {
            parsedTags = JSON.parse(tags);
        } catch (err) {
            parsedTags = tags ? tags.split(",").map((tag) => tag.trim()) : [];
        };

        const discountPercentage = calculateDiscountedPercentage(Number(mrp), Number(price));

        const updateData = {
            _type: _type || "",
            name,
            mrp: Number(mrp),
            price: Number(price),
            discountedPercentage: discountPercentage ? Number(discountPercentage) : 0,
            stock: stock ? Number(stock) : 0,
            category,
            // brand: brand || "",
            badge: badge === "true" ? true : false,
            isAvailable: isAvailable === "true" ? true : false,
            offer: offer === "true" ? true : false,
            description,
            tags: parsedTags,
            images: imagesUrl,
        };

        const updatedProduct = await productModel.findByIdAndUpdate(
            productId,
            updateData,
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: `${name} updated successfully`,
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Update product error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

export {
    addProduct,
    listProducts,
    removeProduct,
    singleProducts,
    updateStock,
    updateProduct,
};
