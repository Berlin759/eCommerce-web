import { Router } from "express";
import {
    getAdminProfile,
    changePassword,
} from "../controllers/adminSettingController.mjs";
import adminAuth from "../middleware/adminAuth.js";

const router = Router();

const routeValue = "/api/setting/";

// Admin Setting routes
router.get(`${routeValue}details`, adminAuth, getAdminProfile);

// Admin Setting routes
router.put(`${routeValue}change-password`, adminAuth, changePassword);

export default router;
