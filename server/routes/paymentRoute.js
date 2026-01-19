import express from "express";
import {
    createPaymentIntent,
    confirmPayment,
    handleStripeWebhook,
    createRazorpayOrder,
    verifyRazorpayPayment,
    handleRazorpayWebhook,
    createPaymentLink,
} from "../controllers/paymentController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

const routeValue = "/api/payment/";

// Stripe payment routes
router.post(
    `${routeValue}stripe/create-payment-intent`,
    userAuth,
    createPaymentIntent
);
router.post(`${routeValue}stripe/confirm-payment`, userAuth, confirmPayment);

// Stripe webhook (no auth required)
router.post(
    `${routeValue}stripe/webhook`,
    express.raw({ type: "application/json" }),
    handleStripeWebhook
);


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
