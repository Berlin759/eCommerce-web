import axios from "axios";
import crypto from "crypto";
import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

const { ObjectId } = mongoose.Types;

const BASE_URL = "https://track.delhivery.com/api";
const TOKEN = process.env.DELHIVERY_TOKEN;

export const handleOrderTrack = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User not authenticated" });
        };

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        };

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Invalid Order" });
        };

        const order = await orderModel.findOne({ _id: new ObjectId(orderId), userId: new ObjectId(userId) });
        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found" });
        };

        const shipmentRes = await axios.get(
            `${BASE_URL}/v1/packages/json/?waybill=${order.shipping.waybill}`,
            {
                headers: {
                    Authorization: `Token ${TOKEN}`,
                },
            },
        );

        if (!shipmentRes) {
            return res.status(400).json({ success: false, message: "Something went Wrong, please try again later." });
        };

        const shipmentData = shipmentRes.data;

        return res.status(200).json({
            success: true,
            shipmentList: shipmentData,
            total: shipmentData.length,
            message: "Order shipment details fetched successfully",
        });
    } catch (error) {
        console.error("handleOrderTrack Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

export const handleDelhiveryWebhook = async (req, res) => {
    try {
        const payload = req.body;
        console.log("Delhivery Webhook payload----->", payload);

        const order = await orderModel.findOne({
            "shipping.waybill": payload.waybill
        });

        if (!order) return res.status(200).json({ success: false });

        order.shipping.status = data.status;
        order.shipping.trackingHistory.push(data);
        order.status = data.status;

        if (data.status === "Delivered") {
            order.status = "delivered";
        };

        await order.save();

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("handleDelhiveryWebhook error------->", error);
        return res.status(500).json({ success: false, message: error.message });
    };
};

export const createShipment = async (order) => {
    try {
        const payload = {
            shipments: [{
                name: order.customerName,
                add: order.address,
                pin: order.pincode,
                city: order.city,
                state: order.state,
                country: order.country,
                phone: order.phone,
                order: order.orderId,
                payment_mode: order.paymentMethod,
                cod_amount: order.paymentMethod === "cod" ? order.totalAmount : 0,
                weight: order.weight ? order.weight : "", //0.5,
                shipment_length: order.shipmentLength ? order.shipmentLength : "", //10,
                shipment_width: order.shipmentWidth ? order.shipmentWidth : "", //10,
                shipment_height: order.shipmentHeight ? order.shipmentHeight : "", //10,
                quantity: order.items.length || 0,
                products_desc: order.items.map(i => i.name).join(", "),
                seller_name: "Your Company",
                seller_add: "Warehouse Address",
                return_add: "Warehouse Address",
                return_pin: "560001",
                return_city: "Bangalore",
                return_state: "Karnataka",
                return_country: "India"
            }],
            pickup_location: {
                name: process.env.DELHIVERY_PICKUP_LOCATION,
            },
        };

        const res = await axios.post(
            `${BASE_URL}/cmu/create.json`,
            payload,
            {
                headers: {
                    Authorization: `Token ${TOKEN}`,
                    "Content-Type": "application/json",
                },
            },
        );

        return res.data;
    } catch (error) {
        console.error("createShipment error------->", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const requestPickup = async (waybill) => {
    try {
        const res = await axios.post(`${BASE_URL}/fm/request/new/`, `wbns=${JSON.stringify([waybill])}`,
            {
                headers: {
                    Authorization: `Token ${TOKEN}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
            },
        );

        return res.data;
    } catch (error) {
        console.error("requestPickup error------->", error);
        return res.status(500).json({ success: false, message: error.message });
    };
};

export const trackShipment = async (waybill) => {
    try {
        const res = await axios.get(
            `${BASE_URL}/v1/packages/json/?waybill=${waybill}`,
            {
                headers: {
                    Authorization: `Token ${TOKEN}`,
                },
            },
        );

        return res.data;
    } catch (error) {
        console.error("trackShipment error------->", error);
        return res.status(500).json({ success: false, message: error.message });
    };
};