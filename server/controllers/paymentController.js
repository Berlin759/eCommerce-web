import Stripe from "stripe";
import crypto from "crypto";
import mongoose from "mongoose";
import { razorpayInstance } from "../config/razorpay.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

const { ObjectId } = mongoose.Types;

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent for Stripe
export const createPaymentIntent = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user.id;

        // Find the order
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        // Verify order belongs to user
        if (order.userId.toString() !== userId) {
            return res.json({
                success: false,
                message: "Unauthorized access to order",
            });
        }

        // Check if order is already paid
        if (order.paymentStatus === "paid") {
            return res.json({ success: false, message: "Order is already paid" });
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.amount * 100), // Convert to cents
            currency: "inr",
            metadata: {
                orderId: order._id.toString(),
                userId: userId,
            },
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            amount: order.amount,
        });
    } catch (error) {
        console.error("Create Payment Intent Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Confirm payment and update order status
export const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId, orderId } = req.body;
        const userId = req.user.id;

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === "succeeded") {
            // Update order payment status
            const order = await orderModel.findById(orderId);
            if (!order) {
                return res.json({ success: false, message: "Order not found" });
            }

            // Verify order belongs to user
            if (order.userId.toString() !== userId) {
                return res.json({
                    success: false,
                    message: "Unauthorized access to order",
                });
            }

            order.paymentStatus = "paid";
            order.paymentMethod = "stripe";
            order.status = "confirmed";
            await order.save();

            res.json({
                success: true,
                message: "Payment confirmed successfully",
                order: order,
            });
        } else {
            res.json({
                success: false,
                message: "Payment not completed",
            });
        }
    } catch (error) {
        console.error("Confirm Payment Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Handle Stripe webhook for payment updates
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case "payment_intent.succeeded":
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata.orderId;

            // Update order status
            await orderModel.findByIdAndUpdate(orderId, {
                paymentStatus: "paid",
                status: "confirmed",
            });
            break;

        case "payment_intent.payment_failed":
            const failedPayment = event.data.object;
            const failedOrderId = failedPayment.metadata.orderId;

            // Update order status
            await orderModel.findByIdAndUpdate(failedOrderId, {
                paymentStatus: "failed",
            });
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};

// Create order with payment method selection
export const createOrder = async (req, res) => {
    try {
        const { items, address, paymentMethod = "cod" } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.json({ success: false, message: "Order items are required" });
        }

        if (!address) {
            return res.json({
                success: false,
                message: "Delivery address is required",
            });
        }

        // Validate address required fields
        const requiredAddressFields = [
            "firstName",
            "lastName",
            "email",
            "street",
            "city",
            "state",
            "zipcode",
            "country",
            "phone",
        ];
        const missingFields = requiredAddressFields.filter((field) => {
            const value =
                address[field] || address[field === "zipcode" ? "zipCode" : field];
            return !value || value.trim() === "";
        });

        if (missingFields.length > 0) {
            return res.json({
                success: false,
                message: `Missing required address fields: ${missingFields.join(", ")}`,
            });
        }

        // Validate items have productId
        const itemsWithoutProductId = items.filter(
            (item) => !item._id && !item.productId
        );
        if (itemsWithoutProductId.length > 0) {
            return res.json({
                success: false,
                message: "All items must have a valid product ID",
            });
        }

        // Calculate total amount
        const totalAmount = items.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);

        // Create order
        const order = new orderModel({
            userId,
            items: items.map((item) => ({
                productId: item._id || item.productId,
                name: item.name || item.title,
                price: item.price,
                quantity: item.quantity,
                image: item.images?.[0] || item.image,
            })),
            amount: totalAmount,
            address: {
                firstName: address.firstName || address.name?.split(" ")[0] || "",
                lastName:
                    address.lastName || address.name?.split(" ").slice(1).join(" ") || "",
                email: address.email || "",
                street: address.street || "",
                city: address.city || "",
                state: address.state || "",
                zipcode: address.zipcode || address.zipCode || "",
                country: address.country || "",
                phone: address.phone || "",
            },
            paymentMethod,
            paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
            status: "pending",
        });

        await order.save();

        // Add order to user's orders array
        await userModel.findByIdAndUpdate(userId, {
            $push: { orders: order._id },
        });

        res.json({
            success: true,
            message: "Order created successfully",
            orderId: order._id,
            order: order,
        });
    } catch (error) {
        console.error("Create Order Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export const createRazorpayOrder = async (req, res) => {
    try {
        const { items, address } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.json({ success: false, message: "Order items are required" });
        }

        if (!address) {
            return res.json({
                success: false,
                message: "Delivery address is required",
            });
        }

        // Validate address required fields
        const requiredAddressFields = [
            "firstName",
            "lastName",
            "email",
            "street",
            "city",
            "state",
            "zipcode",
            "country",
            "phone",
        ];
        const missingFields = requiredAddressFields.filter((field) => {
            const value =
                address[field] || address[field === "zipcode" ? "zipCode" : field];
            return !value || value.trim() === "";
        });

        if (missingFields.length > 0) {
            return res.json({
                success: false,
                message: `Missing required address fields: ${missingFields.join(", ")}`,
            });
        }

        // Validate items have productId
        const itemsWithoutProductId = items.filter(
            (item) => !item._id && !item.productId
        );
        if (itemsWithoutProductId.length > 0) {
            return res.json({
                success: false,
                message: "All items must have a valid product ID",
            });
        }

        // Calculate total amount
        const totalAmount = items.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);

        const options = {
            amount: Math.round(totalAmount * 100), // convert to paise
            currency: "INR",
            receipt: `receipt_${userId}_${Date.now()}`,
        };

        const createPaymentOrder = await razorpayInstance.orders.create(options);
        console.log("createPaymentOrder----------->", createPaymentOrder);

        const order = new orderModel({
            userId: new ObjectId(userId),
            razorpayPaymentId: createPaymentOrder.id,
            razorpayOrderId: createPaymentOrder.id,
            items: items.map((item) => ({
                productId: item._id || item.productId,
                name: item.name || item.title,
                price: item.price,
                quantity: item.quantity,
                image: item.images?.[0] || item.image,
            })),
            amount: totalAmount,
            address: {
                firstName: address.firstName || address.name?.split(" ")[0] || "",
                lastName:
                    address.lastName || address.name?.split(" ").slice(1).join(" ") || "",
                email: address.email || "",
                street: address.street || "",
                city: address.city || "",
                state: address.state || "",
                zipcode: address.zipcode || address.zipCode || "",
                country: address.country || "",
                phone: address.phone || "",
            },
            paymentMethod: "razorpay",
            paymentStatus: "pending",
            currency: "INR",
            status: "pending",
        });

        await order.save();

        // Add order to user's orders array
        await userModel.findByIdAndUpdate(userId, {
            $push: { orders: order._id },
        });

        res.json({
            success: true,
            message: "Order created successfully",
            order: order,
            orderId: order._id,
            amount: order.amount,
            currency: order.currency,
            name: "Pranshu Ecommerce Seller",
            razorpayOrderId: createPaymentOrder.id,
        });
    } catch (error) {
        console.error("Create Razorpay Order Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

export const verifyRazorpayPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const orderDetails = await orderModel.findById(orderId);
        if (!orderDetails) {
            return res.json({ success: false, message: "Order not found" });
        };

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Missing payment verification details",
            });
        };

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;
        if (!isAuthentic) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature",
            });
        };

        // Verify order belongs to user
        if (orderDetails.userId.toString() !== userId) {
            return res.json({
                success: false,
                message: "Unauthorized access to order",
            });
        };

        orderDetails.paymentStatus = "paid";
        orderDetails.status = "confirmed";
        await orderDetails.save();

        res.json({
            success: true,
            message: "Payment Verify successfully",
            order: orderDetails,
        });
    } catch (error) {
        console.error("Verify Razorpay Payment Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

export const handleRazorpayWebhook = async (req, res) => {
    try {
        const payload = req.rawBody;
        console.log("Webhook payload----->", payload);
        const signature = req.headers["x-razorpay-signature"];

        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
            .update(payload)
            .digest("hex");

        if (signature !== expected) {
            console.warn("Webhook signature mismatch");
            return res.status(400).json({ success: false, message: "Invalid signature" });
        };

        const event = JSON.parse(payload.toString());
        console.log("Webhook event----->", event.event);

        if (event.event === "payment_link.paid") {
            const p = event.payload.payment.entity;

            await orderModel.findOneAndUpdate(
                { razorpayPaymentLinkId: event.payload.payment_link.entity.id },
                { paymentStatus: "paid", status: "confirmed" }
            );
        }

        if (event.event === "payment_link.failed") {
            await orderModel.findOneAndUpdate(
                { razorpayPaymentLinkId: event.payload.payment_link.entity.id },
                { paymentStatus: "failed", status: "cancelled" }
            );
        };

        // if (event.event === "payment.captured" || event.event === "payment.authorized") {
        //     const p = event.payload.payment.entity;

        //     // update order Payment status
        //     await orderModel.findOneAndUpdate({ razorpayOrderId: p.order_id }, { paymentStatus: "paid" });
        // } else if (event.event === "payment.failed") {
        //     const p = event.payload.payment.entity;
        //     await orderModel.findOneAndUpdate({ razorpayOrderId: p.order_id }, { paymentStatus: "failed", status: "cancelled" });
        // } else if (event.event.startsWith("refund.")) {
        //     const r = event.payload.refund.entity;
        //     // upsert refund
        //     await orderModel.findOneAndUpdate(
        //         { razorpayPaymentId: r.id },
        //         {
        //             paymentStatus: "refunded",
        //             status: "cancelled"
        //         },
        //         { upsert: true }
        //     );
        // };

        return res.json({ success: true });
    } catch (error) {
        console.error("webhook error------->", error);
        return res.status(500).json({ success: false, message: error.message });
    };
};

export const createPaymentLink = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("req.body------------>", req.body);
        const { orderId } = req.body;

        const order = await orderModel.findById(orderId);
        console.log("order------------>", order);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        };

        if (order.userId.toString() !== userId.toString()) {
            return res.json({
                success: false,
                message: "Unauthorized access to order",
            });
        };

        if (order.paymentStatus === "paid") {
            return res.json({ success: false, message: "Order is already paid" });
        };

        const link = await razorpayInstance.paymentLink.create({
            amount: order.amount * 100,
            currency: "INR",
            description: "Order Payment",
            customer: {
                name: order.address.firstName,
                email: order.address.email,
                contact: order.address.phone,
            },
            notify: {
                sms: true,
                email: true,
            },
            callback_url: `${process.env.CLIENT_URL}/payment-success?order_id=${order._id}`,
            callback_method: "get",
        });
        console.log("link------------>", link);

        if(!link){
            return res.json({ success: false, message: "Payment Link has not create. Please try again"});
        };

        await orderModel.findOneAndUpdate(
            { _id: new ObjectId(order._id) },
            {
                razorpayPaymentLinkId: link.id,
                razorpayPaymentLinkRef: link.short_url,
            },
        );

        return res.status(200).json({
            success: true,
            message: "Your payment has been successfully processed!",
            paymentLink: link.short_url,
            orderId: order._id,
        });
    } catch (error) {
        console.error("Create Razorpay payment link Error------>", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};