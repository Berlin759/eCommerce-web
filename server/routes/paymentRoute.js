import express from "express";
import {
    createRazorpayOrder,
    verifyRazorpayPayment,
    handleRazorpayWebhook,
    createPaymentLink,
} from "../controllers/paymentController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

const routeValue = "/api/payment/";

// Create Razorpay Order
router.post(`${routeValue}razorpay/create-order`, userAuth, createRazorpayOrder);
router.post(`${routeValue}razorpay/verify-payment`, userAuth, verifyRazorpayPayment);

// Razorpay webhook (no auth required)
router.post(
    `${routeValue}razorpay/webhook`,
    express.raw({ type: "application/json" }),
    handleRazorpayWebhook
);

router.post(`${routeValue}razorpay/create-payment-link`, userAuth, createPaymentLink);

export default router;
