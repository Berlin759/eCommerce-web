import { Router } from "express";
import {
    getAdminProfile,
    getSettingDetails,
    changePassword,
    updateDiscountedPercentage,
} from "../controllers/adminSettingController.mjs";
import adminAuth from "../middleware/adminAuth.js";

const router = Router();

const routeValue = "/api/setting/";

// Admin Setting routes
router.get(`${routeValue}details`, adminAuth, getAdminProfile);
router.get(`${routeValue}list`, adminAuth, getSettingDetails);

// Admin Setting routes
router.put(`${routeValue}change-password`, adminAuth, changePassword);
router.put(`${routeValue}update-discounted-percentage`, adminAuth, updateDiscountedPercentage);

export default router;
