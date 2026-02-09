import Stripe from "stripe";
import crypto from "crypto";
import mongoose from "mongoose";
import { razorpayInstance } from "../config/razorpay.js";
import { createShipment, generateAWB, requestPickup } from "./shipmentController.js";
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
            return res.status(400).json({ success: false, message: "Order not found" });
        }

        // Verify order belongs to user
        if (order.userId.toString() !== userId) {
            return res.status(400).json({
                success: false,
                message: "Unauthorized access to order",
            });
        }

        // Check if order is already paid
        if (order.paymentStatus === "paid") {
            return res.status(400).json({ success: false, message: "Order is already paid" });
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

        return res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            amount: order.amount,
        });
    } catch (error) {
        console.error("Create Payment Intent Error:", error);
        return res.status(400).json({ success: false, message: error.message });
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
                return res.status(400).json({ success: false, message: "Order not found" });
            }

            // Verify order belongs to user
            if (order.userId.toString() !== userId) {
                return res.status(400).json({
                    success: false,
                    message: "Unauthorized access to order",
                });
            }

            order.paymentStatus = "paid";
            order.paymentMethod = "stripe";
            order.status = "confirmed";
            await order.save();

            return res.status(200).json({
                success: true,
                message: "Payment confirmed successfully",
                order: order,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Payment not completed",
            });
        }
    } catch (error) {
        console.error("Confirm Payment Error:", error);
        return res.status(400).json({ success: false, message: error.message });
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

    return res.status(200).json({ received: true });
};

export const createRazorpayOrder = async (req, res) => {
    try {
        const { items, address } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Order items are required" });
        }

        if (!address) {
            return res.status(400).json({
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
            return res.status(400).json({
                success: false,
                message: `Missing required address fields: ${missingFields.join(", ")}`,
            });
        }

        // Validate items have productId
        const itemsWithoutProductId = items.filter(
            (item) => !item._id && !item.productId
        );
        if (itemsWithoutProductId.length > 0) {
            return res.status(400).json({
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
            paymentMethod: "online",
            paymentStatus: "pending",
            currency: "INR",
            status: "pending",
        });

        await order.save();

        // Add order to user's orders array
        await userModel.findByIdAndUpdate(userId, {
            $push: { orders: order._id },
        });

        return res.status(200).json({
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

export const createPaymentLink = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId, finalAmount } = req.body;

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found" });
        };

        if (order.userId.toString() !== userId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Unauthorized access to order",
            });
        };

        if (order.paymentStatus === "paid") {
            return res.status(400).json({ success: false, message: "Order is already paid" });
        };

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: finalAmount * 100,
            currency: "INR",
            receipt: orderId.toString(),
        });

        await orderModel.findByIdAndUpdate(orderId, {
            razorpayOrderId: razorpayOrder.id,
        });

        // const string_order_id = orderId.toString();

        // const link = await razorpayInstance.paymentLink.create({
        //     amount: finalAmount * 100,
        //     currency: "INR",
        //     // title: "Order Payment",
        //     description: `Payment for Order #${string_order_id.slice(-8).toUpperCase()}`,
        //     reference_id: string_order_id,
        //     customer: {
        //         name: order.address.firstName,
        //         email: order.address.email,
        //         contact: order.address.phone,
        //     },
        //     notify: {
        //         sms: true,
        //         email: true,
        //     },
        //     callback_url: `${process.env.CLIENT_URL}/payment-success?order_id=${order._id}`,
        //     callback_method: "get",
        // });

        // if (!link) {
        //     return res.status(400).json({ success: false, message: "Payment Link has not create. Please try again" });
        // };

        // await orderModel.findOneAndUpdate(
        //     { _id: new ObjectId(order._id) },
        //     {
        //         razorpayPaymentLinkId: link.id,
        //         razorpayPaymentLinkRef: link.short_url,
        //     },
        // );

        return res.status(200).json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            amount: finalAmount,
            currency: razorpayOrder.currency,
            name: "Online Product Sale", // 👈 shows instead of Donate
        });

        // return res.status(200).json({
        //     success: true,
        //     message: "Your payment has been successfully processed!",
        //     paymentLink: link.short_url,
        //     orderId: order._id,
        // });
    } catch (error) {
        console.error("Create Razorpay payment link Error------>", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

export const verifyRazorpayPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId, orderAmount, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const orderDetails = await orderModel.findById(orderId);
        if (!orderDetails) {
            return res.status(400).json({ success: false, message: "Order not found" });
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
            return res.status(400).json({
                success: false,
                message: "Unauthorized access to order",
            });
        };

        await orderModel.findByIdAndUpdate(orderId, {
            discountAmount: orderAmount,
            paymentStatus: "paid",
            paymentMethod: "online",
            status: "confirmed",
            razorpayPaymentId: razorpay_payment_id,
        });

        return res.status(200).json({
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
        const eventType = req.body;
        console.log("Webhook eventType----->", eventType);
        // const signature = req.headers["x-razorpay-signature"];

        // if (!signature) {
        //     return res.status(400).json({ success: false, message: "Signature missing" });
        // };

        // const expected = crypto
        //     .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        //     .update(payload)
        //     .digest("hex");

        // if (signature !== expected) {
        //     console.warn("Webhook signature mismatch");
        //     return res.status(400).json({ success: false, message: "Invalid signature" });
        // };

        // const event = JSON.parse(payload.toString());
        console.log("Webhook eventType----->", eventType.event);

        if (eventType.event === "order.paid") {
            console.log("Webhook eventType payload----->", eventType.payload);
            const orderEntity = eventType.payload.order.entity;
            const razorpayOrderId = orderEntity.id;

            const order = await orderModel.findOne({ razorpayOrderId: razorpayOrderId });
            console.log("Webhook order----->", order);
            if (!order) {
                return res.status(400).send("Order not found");
            };

            if (order.paymentStatus === "paid" && order?.shipping && order?.shipping?.awb) {
                console.log("Duplicate webhook ignored for order:", order.orderId);
                res.sendStatus(200);
            };

            order.paymentStatus = "paid";
            order.status = "confirmed";
            order.paymentMethod = "online";
            await order.save();

            // Create shipment
            let payload = {
                totalAmount: order.amount || 0,
                customerName: order.address.firstName + " " + order.address.lastName,
                lastName: order.address.lastName,
                email: order.address.email,
                address: order.address.street,
                pincode: order.address.zipcode,
                city: order.address.city,
                state: order.address.state,
                country: order.address.country,
                phone: order.address.phone,
                orderId: order.orderId,
                order_date: order.date,
                paymentMethod: order.paymentMethod || "online",
                items: order.items,
            };

            const shipmentData = await createShipment(payload);
            console.log("Webhook shipmentData----->", shipmentData);

            if (!shipmentData.success) {
                console.log("Delhivery shipment data failed:", shipmentData.message);

                order.shipping = {
                    courier: "Shiprocket",
                    shipmentId: "",
                    awb: "",
                    status: "shipment_failed",
                };

                await order.save();

                res.sendStatus(200);
            };

            const shipment = shipmentData.data;
            console.log("Razorpay Webhook shipment----->", shipment);

            const createAWB = await generateAWB(shipment.shipment_id);
            console.log("Razorpay Webhook createAWB----->", createAWB);
            if (!createAWB.success) {
                console.log("Razorpay Webhook Create AWB failed:", createAWB.message);

                order.shipping = {
                    courier: "Shiprocket",
                    shipmentId: "",
                    awb: "",
                    status: "awb_failed",
                };

                await order.save();

                return res.status(400).json({ success: false, message: "Your Order shipment failed, please try again later." });
            };

            // Request pickup
            const pickupRequest = await requestPickup(shipment.shipment_id);
            console.log("Razorpay Webhook pickupRequest----->", pickupRequest);
            if (!pickupRequest.success) {
                console.log("Razorpay Webhook shipment Request failed:", pickupRequest.message);

                order.shipping = {
                    courier: "Shiprocket",
                    shipmentId: "",
                    awb: "",
                    status: "pickup_request_failed",
                };

                await order.save();

                return res.status(400).json({ success: false, message: "Your Order shipment request failed, please try again later." });
            };

            order.shipping = {
                courier: "Shiprocket",
                shipmentId: shipment.shipment_id,
                awb: createAWB.data.awb_code,
                status: "Pickup Requested",
            };

            await order.save();
        } else if (eventType.event === "order.failed") {
            await orderModel.findOneAndUpdate(
                { razorpayOrderId: eventType.payload.order.entity.id },
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

        res.sendStatus(200);
    } catch (error) {
        console.error("webhook error------->", error);
        return res.status(500).json({ success: false, message: error.message });
    };
};