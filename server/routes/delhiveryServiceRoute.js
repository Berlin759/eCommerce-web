import express from "express";
import {
    handleOrderTrack,
    handleDelhiveryWebhook,
} from "../controllers/delhiveryController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

const routeValue = "/api/delhivery/";

// Razorpay webhook (no auth required)
router.post(`${routeValue}order-track`, userAuth, handleOrderTrack);
router.post(`${routeValue}webhook`, express.raw({ type: "application/json" }), handleDelhiveryWebhook);

export default router;
