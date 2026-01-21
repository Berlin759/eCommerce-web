import { ObjectId } from "mongodb";
import ratingModel from "../models/ratingModel.js";

const addRating = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {
            orderId,
            productId,
            rating,
            description,
        } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Invalid Order Id!",
            });
        };

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Invalid Product Id!",
            });
        };

        if (!rating) {
            return res.status(400).json({
                success: false,
                message: "Please select rating start!",
            });
        };

        // const existingRating = await ratingModel.findOne({
        //     userId: userId,
        //     productId: productId,
        // });

        // if (existingRating) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "You already rated this product",
        //     });
        // };

        const ratingPayload = {
            userId: new ObjectId(userId),
            orderId: new ObjectId(orderId),
            productId: new ObjectId(productId),
            rating: rating,
            description: description,
        };

        const createRating = await ratingModel.create(ratingPayload);

        if (!createRating) {
            return res.status(400).json({
                success: false,
                message: "Something went Wrong, please try again later.",
            });
        };

        return res.status(200).json({
            success: true,
            message: "Rating added successfully",
        });
    } catch (error) {
        console.error("addRating Error------------>", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

const listRatings = async (req, res) => {
    try {
        const { productId } = req.query;

        let filter = {};

        if (productId) {
            filter.productId = new ObjectId(productId);
        };

        let dbRatings = await ratingModel.find(filter).populate("userId", "name email avatar").sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            ratings: dbRatings,
            total: dbRatings.length,
        });
    } catch (error) {
        console.error("List Ratings error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

const listByAdminRatings = async (req, res) => {
    try {
        const { page = 1, limit = 10, rating, search, sort } = req.query;

        let filter = {};

        if (rating && rating !== "all") {
            filter.rating = parseInt(rating);
        };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        };

        let sortBy;
        if (sort === "new") {
            sortBy = { createdAt: -1 };
        } else if (sort === "old") {
            sortBy = { createdAt: 1 };
        } else if (sort === "high") {
            sortBy = { rating: -1 };
        } else if (sort === "low") {
            sortBy = { rating: 1 };
        } else {
            sortBy = { createdAt: -1 };
        };

        const ratingList = await ratingModel.find(filter)
            .populate("userId", "name email avatar")
            .populate("productId", "name images category")
            .sort(sortBy)
            // .limit(limit * 1)
            // .skip((page - 1) * limit);

        const totalRatingCount = await ratingModel.countDocuments(filter);

        return res.status(200).json({
            success: true,
            ratings: ratingList,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalRatingCount / limit),
                totalItems: totalRatingCount,
                itemsPerPage: parseInt(limit),
            },
            totalCount: totalRatingCount,
        });
    } catch (error) {
        console.error("List By Admin Ratings error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

const removeRating = async (req, res) => {
    try {
        const { ratingId } = req.body;

        if (!ratingId) {
            return res.status(400).json({
                success: false,
                message: "Invalid Rating Id!",
            });
        };

        const ratingDetails = await ratingModel.findById(ratingId);
        if (!ratingDetails) {
            return res.status(400).json({ success: false, message: "Rating Details not found" });
        };

        await ratingModel.findByIdAndDelete(ratingDetails._id);

        return res.status(200).json({ success: true, message: "Rating removed successfully" });
    } catch (error) {
        console.error("removeRating Error------------>", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const singleRating = async (req, res) => {
    try {
        const ratingId = req.body._id || req.query._id || req.params.id;

        if (!ratingId) {
            return res.status(400).json({
                success: false,
                message: "Rating ID is required",
            });
        };

        const ratingDetails = await ratingModel.findById(ratingId);

        if (!ratingDetails) {
            return res.status(400).json({
                success: false,
                message: "Rating not found",
            });
        };

        return res.status(200).json({ success: true, rating: ratingDetails });
    } catch (error) {
        console.error("Single rating error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

const updateRating = async (req, res) => {
    try {
        const { ratingId, rating, description } = req.body;

        if (!ratingId) {
            return res.status(400).json({
                success: false,
                message: "Rating Id is required",
            });
        };

        let existingRating = await ratingModel.findById(ratingId);
        if (!existingRating) {
            return res.status(400).json({
                success: false,
                message: "Rating not found",
            });
        };

        const updateObj = {};

        if (rating) {
            updateObj["rating"] = rating;
        };

        if (description) {
            updateObj["description"] = description;
        };

        if (Object.keys(updateObj).length > 0) {
            let updateRating = await ratingModel.findByIdAndUpdate(ratingId, updateObj, { new: true });

            if (!updateRating) {
                return res.status(400).json({
                    success: false,
                    message: "Something went Wrong, please try again later.",
                });
            };

            existingRating = updateRating;
        };

        return res.status(200).json({
            success: true,
            message: "Rating updated successfully",
            rating: existingRating,
        });
    } catch (error) {
        console.error("Update Rating error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

export {
    addRating,
    listRatings,
    listByAdminRatings,
    removeRating,
    singleRating,
    updateRating,
};
