import axios from "axios";
import crypto from "crypto";
import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { getTomorrowInTimezone } from "../config/general.js";

const { ObjectId } = mongoose.Types;

const SHIPMENT_BASE_URL = process.env.SHIPMENT_BASE_URL;
const TOKEN = process.env.DELHIVERY_TOKEN;

let token = null;

export const getToken = async () => {
    if (token) return token;

    const res = await axios.post(
        `${SHIPMENT_BASE_URL}/auth/login`,
        {
            email: process.env.SHIPMENT_EMAIL,
            password: process.env.SHIPMENT_PASSWORD,
        },
    );

    token = res.data.token;
    return token;
};

export const handleOrderTrack = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User not authenticated" });
        };

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Invalid Order" });
        };

        const order = await orderModel.findOne({ _id: new ObjectId(orderId), userId: new ObjectId(userId) });
        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found" });
        };

        if (!order.shipping || !order.shipping.awb) {
            return res.status(400).json({
                success: false,
                message: "Shipment not created yet. Tracking unavailable."
            });
        };

        const token = await getToken();

        const shipmentRes = await axios.get(
            `${SHIPMENT_BASE_URL}/courier/track/awb/${order.shipping.awb}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("shipmentRes------------>", shipmentRes);

        if (!shipmentRes) {
            return res.status(400).json({ success: false, message: "No tracking data" });
        };

        const shipment = shipmentRes?.tracking_data;

        if (!shipment) {
            return res.json({ success: false, message: "No tracking data" });
        };

        return res.status(200).json({
            success: true,
            shipmentDetails: {
                awb: order.shipping.awb,
                status: shipment.shipment_status,
                history: shipment.shipment_track_activities.map((item) => ({
                    status: item.status,
                    location: item.location,
                    time: item.date,
                })),
            },
            message: "Order shipment details fetched successfully",
        });
    } catch (error) {
        console.error("handleOrderTrack Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

export const createShipment = async (order) => {
    try {
        const token = await getToken();
        console.log("token--------------->", token);

        const payload = {
            order_id: order.orderId,
            order_date: new Date().toISOString(),
            pickup_location: process.env.DELHIVERY_PICKUP_LOCATION,

            billing_customer_name: order.customerName,
            billing_last_name: order.lastName,
            billing_address: order.address,
            billing_city: order.city,
            billing_pincode: order.pincode,
            billing_state: order.state,
            billing_country: order.country,
            billing_phone: order.phone,
            billing_email: order.email || "test@example.com",
            shipping_is_billing: true,

            order_items: order.items.map((i) => ({
                name: i.name,
                sku: String(i.productId),
                units: Number(i.quantity),
                selling_price: Number(i.price),
            })),

            payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
            sub_total: Number(order.totalAmount),

            // weight: Number(order.weight || 0.5),
            // shipment_length: Number(order.shipmentLength || 10),
            // shipment_width: Number(order.shipmentWidth || 10),
            // shipment_height: Number(order.shipmentHeight || 10),

            length: Number(order.shipmentLength || 10),
            breadth: Number(order.shipmentWidth || 10),
            height: Number(order.shipmentHeight || 10),
            weight: Number(order.weight || 0.5),
        };
        console.log("createShipment payload----->", payload);

        const res = await axios.post(
            `${SHIPMENT_BASE_URL}/orders/create/adhoc`, payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("createShipment res.data----->", res.data);

        return { success: true, message: "", data: res.data };
    } catch (error) {
        console.error("createShipment error------->", error.response?.data || error.message);
        return { success: false, message: error.message };
    }
};

export const generateAWB = async (shipmentId) => {
    try {
        if (!shipmentId) {
            return { success: false, message: "Shipment Id is required!" };
        };

        if (process.env.SHIPMENT_TEST_MODE === "true") {
            return {
                success: true,
                data: {
                    awb_code: "TESTAWB123456",
                    courier_name: "Mock Courier"
                },
            };
        };

        const token = await getToken();

        const res = await axios.post(`${SHIPMENT_BASE_URL}/courier/assign/awb`,
            { shipment_id: shipmentId },
            { headers: { Authorization: `Bearer ${token}` } },
        );
        console.log("generateAWB res.data----->", res.data);

        if (res.data.awb_assign_status !== 1) {
            return { success: false, message: res.data.message || "AWB assignment failed" };
        };

        return { success: true, message: "", data: res.data.response.data };
    } catch (error) {
        console.error("generateAWB error------->", error.response?.data || error.message);
        return { success: false, message: error.message };
    };
};

export const requestPickup = async (shipmentId) => {
    try {
        if (!shipmentId) {
            return { success: false, message: "Shipment Id is required!" };
        };

        if (process.env.SHIPMENT_TEST_MODE === "true") {
            return { success: true, message: "" };
        };

        const token = await getToken();

        const res = await axios.post(`${SHIPMENT_BASE_URL}/courier/generate/pickup`,
            { shipment_id: shipmentId },
            { headers: { Authorization: `Bearer ${token}` } },
        );
        console.log("requestPickup res.data----->", res.data);

        if (res.data.pickup_status !== 1) {
            return { success: false, message: res.data.message || "Pickup Request failed" };
        };

        return { success: true, message: "", data: res.data };
    } catch (error) {
        console.error("requestPickup error------->", error.response?.data || error.message);
        return { success: false, message: error.message };
    };
};

export const handlesShipmentWebhook = async (req, res) => {
    try {
        console.log("Shipment Webhook req.body----->", req.body);
        const { awb, current_status, reason } = req.body;

        const order = await orderModel.findOne({
            "shipping.awb": awb,
        });
        console.log("Shipment Webhook order----->", order);

        if (!order) {
            return res.sendStatus(200);
        };

        if (current_status === "Delivered") {
            order.status = "delivered";
            order.shipping.status = "Delivered";
        };

        if (current_status === "NDR") {
            order.shipping.status = "NDR";
            order.shipping.ndrReason = reason;
        };

        if (current_status === "RTO Delivered") {
            order.status = "returned";
            order.shipping.status = "RTO";
        };

        await order.save();

        res.sendStatus(200);
    } catch (error) {
        console.error("handleDelhiveryWebhook error------->", error);
        return res.status(500).json({ success: false, message: error.message });
    };
};

export const cancelOrder = async (req, res) => {
    const order = await orderModel.findById(req.params.id);
    console.log("cancelOrder order----->", order);

    if (!order) {
        return res.status(400).json({ success: false, message: "Order not found" });
    };

    if (order.shipping?.awb) {
        await cancelShipment(order.shipping.awb);
    };

    order.status = "cancelled";
    await order.save();

    return res.status(400).json({ success: true, message: "Order cancel successfully" });
};

export const cancelShipment = async (awb) => {
    const token = await getToken();

    const res = await axios.post(
        `${process.env.SHIPMENT_BASE_URL}/orders/cancel`,
        { awbs: [awb] },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("cancelShipment res data----->", res.data);

    return res.data;
};