import { Router } from "express";
import {
    getAdminProfile,
    getSettingDetails,
    changePassword,
    updateDiscountedPercentage,
    toggleMaintenanceMode,
    getMaintenanceStatus,
} from "../controllers/adminSettingController.mjs";
import adminAuth from "../middleware/adminAuth.js";

const router = Router();

const routeValue = "/api/setting/";

// Public - client checks maintenance status
router.get(`${routeValue}maintenance-status`, getMaintenanceStatus);

// Admin Setting routes
router.get(`${routeValue}details`, adminAuth, getAdminProfile);
router.get(`${routeValue}list`, adminAuth, getSettingDetails);

// Admin Setting routes
router.put(`${routeValue}change-password`, adminAuth, changePassword);
router.put(`${routeValue}update-discounted-percentage`, adminAuth, updateDiscountedPercentage);
router.put(`${routeValue}toggle-maintenance`, adminAuth, toggleMaintenanceMode);

export default router;
