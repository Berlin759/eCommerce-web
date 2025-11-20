import express from "express";
import {
    createBanner,
    getBanners,
    getBanner,
    updateBanner,
    deleteBanner,
} from "../controllers/bannerController.mjs";
import upload from "../middleware/multer.mjs";
import adminAuth from "../middleware/adminAuth.js";

const bannerRouter = express.Router();

const routeValue = "/api/banner";

// Public routes
bannerRouter.get(`${routeValue}`, getBanners);
bannerRouter.get(`${routeValue}/:id`, getBanner);

// Admin only routes
bannerRouter.post(
    `${routeValue}`,
    adminAuth,
    upload.single("image"),
    createBanner
);
bannerRouter.put(
    `${routeValue}/:id`,
    adminAuth,
    upload.single("image"),
    updateBanner
);
bannerRouter.delete(`${routeValue}/:id`, adminAuth, deleteBanner);

export default bannerRouter;
