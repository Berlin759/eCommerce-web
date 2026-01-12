import axios from "axios";
import crypto from "crypto";
import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

const { ObjectId } = mongoose.Types;

// const BASE_URL = "https://track.delhivery.com/api";
const BASE_URL = process.env.DELHIVERY_BASE_URL;
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
            `${BASE_URL}/api/v1/packages/json/?waybill=${order.shipping.waybill}`,
            {
                headers: {
                    Authorization: `Token ${TOKEN}`,
                    'Content-Type': 'application/json',
                },
            },
        );
        console.log("shipmentRes------------>", shipmentRes);

        if (!shipmentRes) {
            return res.status(400).json({ success: false, message: "No tracking data" });
        };

        const shipment = shipmentRes.data.ShipmentData?.[0]?.Shipment;

        if (!shipment) {
            return res.json({ success: false, message: "No tracking data" });
        };

        return res.status(200).json({
            success: true,
            shipmentDetails: {
                waybill: order.shipping.waybill,
                status: shipment.Status.Status,
                history: shipment.Scans.map(scan => ({
                    status: scan.ScanDetail.Scan,
                    location: scan.ScanDetail.ScannedLocation,
                    time: scan.ScanDetail.ScanDateTime
                })),
            },
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
                seller_name: process.env.SELLER_NAME,
                seller_add: process.env.SELLER_ADDRESS,
                return_add: process.env.RETURN_ADDRESS,
                return_pin: process.env.RETURN_PIN,
                return_city: process.env.RETURN_CITY,
                return_state: process.env.RETURN_STATE,
                return_country: process.env.RETURN_COUNTRY,
            }],
            pickup_location: {
                name: process.env.DELHIVERY_PICKUP_LOCATION,
            },
        };

        const res = await axios.post(
            `${BASE_URL}/api/cmu/create.json`,
            payload,
            {
                headers: {
                    Authorization: `Token ${TOKEN}`,
                    Accept: 'application/json',
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

export const requestPickup = async (payload) => {
    try {
        const res = await axios.post(`${BASE_URL}/fm/request/new/`, payload,
            {
                headers: {
                    Authorization: `Token ${TOKEN}`,
                    'Content-Type': 'application/json',
                    // "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        );

        return res.data;
    } catch (error) {
        console.error("requestPickup error------->", error);
        return res.status(500).json({ success: false, message: error.message });
    };
};