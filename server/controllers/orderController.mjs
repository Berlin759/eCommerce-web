import { ObjectId } from "mongodb";
import moment from "moment";
import { generateOtp, sendOtpOnWhatsApp, generateOrderId, getTomorrowInTimezone } from "../config/general.js";
import Constants from "../constants/index.js";
import { createShipment, generateAWB, requestPickup } from "./shipmentController.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import OTPModel from "../models/otpModel.js";
import settingModel from "../models/settingModel.js";
import ratingModel from "../models/ratingModel.js";

// Create a new order
const createOrder = async (req, res) => {
    try {
        const { items, amount, address } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User not authenticated" });
        };

        // Verify user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Order items are required" });
        };

        if (!amount) {
            return res.status(400).json({ success: false, message: "Order amount is required" });
        };

        if (!address) {
            return res.status(400).json({ success: false, message: "Delivery address is required" });
        };

        address["firstName"] = user.name;
        address["email"] = user.email;

        const getAddressValue = (field) => {
            switch (field) {
                case "firstName":
                    return (
                        address.firstName ||
                        address.first_name ||
                        address.name?.split(" ")[0] ||
                        ""
                    );
                // case "lastName":
                //     return (
                //         address.lastName ||
                //         address.last_name ||
                //         address.name?.split(" ").slice(1).join(" ") ||
                //         ""
                //     );
                case "zipcode":
                    return (
                        address.zipcode ||
                        address.zipCode ||
                        address.zip_code ||
                        address.postal_code ||
                        ""
                    );
                default:
                    return address[field] || "";
            }
        };

        const requiredAddressFields = [
            "firstName",
            // "lastName",
            "email",
            "street",
            "city",
            "state",
            "zipcode",
            "country",
            "phone",
        ];

        const missingFields = requiredAddressFields.filter((field) => {
            const value = getAddressValue(field);
            return !value || value.toString().trim() === "";
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required address fields: ${missingFields.join(", ")}`,
                debug: {
                    receivedAddress: address,
                    missingFields: missingFields.map((field) => ({
                        field,
                        value: getAddressValue(field),
                    })),
                },
            });
        }

        // Validate items have productId
        const itemsWithoutProductId = items.filter(
            (item) => !item._id && !item.productId
        );
        if (itemsWithoutProductId.length > 0) {
            return res.status(400).json({ success: false, message: "All items must have a valid product ID" });
        };

        const orderId = await generateOrderId();

        // Create new order with properly mapped fields
        const newOrder = new orderModel({
            userId: user._id,
            orderId: orderId,
            items: items.map((item) => ({
                productId: item._id || item.productId,
                name: item.name || item.title,
                price: item.price,
                quantity: item.quantity,
                image: item.images?.[0] || item.image,
            })),
            amount,
            address: {
                firstName: getAddressValue("firstName"),
                // lastName: getAddressValue("lastName"),
                email: address.email || "",
                street: address.street || address.address || "",
                city: address.city || "",
                state: address.state || address.province || "",
                zipcode: getAddressValue("zipcode"),
                country: address.country || "",
                phone: address.phone || address.phoneNumber || "",
            },
        });

        await newOrder.save();

        // Add order to user's orders array
        await userModel.findByIdAndUpdate(userId, {
            $push: { orders: newOrder._id },
        });

        return res.status(200).json({
            success: true,
            message: "Order created successfully",
            order: newOrder,
            orderId: newOrder._id,
        });
    } catch (error) {
        console.error("Create Order Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

// Get all orders (Admin)
const getAllOrders = async (req, res) => {
    try {
        const orders = await orderModel
            .find({})
            .populate("userId")
            .populate("items.productId")
            .sort({ date: -1 });

        return res.status(200).json({
            success: true,
            orders,
            total: orders.length,
            message: "Orders fetched successfully",
        });
    } catch (error) {
        console.error("Get All Orders Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

// Get orders by user ID
const getUserOrders = async (req, res) => {
    try {
        // Check if it's an admin request with userId param
        const { userId } = req.params;
        const requestUserId = userId || req.user?.id; // Use param for admin, auth user for regular users

        if (!requestUserId) {
            return res.status(400).json({ success: false, message: "User ID not provided" });
        };

        const orders = await orderModel
            .find({ userId: requestUserId })
            .populate("items.productId")
            .sort({ date: -1 });

        return res.status(200).json({
            success: true,
            orders,
            total: orders.length,
            message: "User orders fetched successfully",
        });
    } catch (error) {
        console.error("Get User Orders Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const getAdminUserOrdersDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const adminId = req.user?.id;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Invalid Order Id" });
        };

        const order = await orderModel
            .findOne({ _id: orderId })
            .populate("items.productId")
            .populate("userId");

        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found" });
        };

        return res.status(200).json({ success: true, order, message: "User Order fetched successfully" });
    } catch (error) {
        console.error("Get Admin User Orders Details Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Get single order by user ID and order ID
const getUserOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id; // From auth middleware

        const settingDetails = await settingModel.findOne({}).select("discountedPercentage");

        const order = await orderModel
            .findOne({ _id: orderId, userId })
            .populate("items.productId");

        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found" });
        };

        let alreadyRatingAdd = false;

        const orderObj = order.toObject();

        const ratingDetails = await ratingModel.findOne({
            orderId: new ObjectId(orderId),
            userId: new ObjectId(userId),
        });

        if (ratingDetails) {
            alreadyRatingAdd = true;
        };

        orderObj.onlinePaydisPercentage = settingDetails?.discountedPercentage || 0;
        orderObj.alreadyRatingAdd = alreadyRatingAdd;

        return res.status(200).json({ success: true, order: orderObj, message: "Order fetched successfully" });
    } catch (error) {
        console.error("Get User Order By ID Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

const sendOrderOTP = async (req, res) => {
    try {
        const { orderId, phone } = req.body;
        const userId = req.user.id;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Invalid Order Id" });
        };

        if (!phone) {
            return res.status(400).json({ success: false, message: "Invalid phone number" });
        };

        const order = await orderModel.findOne({ _id: orderId, userId });

        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found" });
        };

        const otp = await generateOtp();
        const currentTime = moment().utc().valueOf();
        const expire_at = moment(currentTime + Constants.OTP_EXPIRATION_TIME).utc().toDate();

        const payload = {
            userId: new ObjectId(userId),
            orderId: new ObjectId(orderId),
            otp: otp,
            expireAt: expire_at,
        };

        await OTPModel.create(payload);

        const sendWhatsAppOtp = await sendOtpOnWhatsApp(phone, otp);
        if (!sendWhatsAppOtp.success) {
            return res.status(400).json(sendWhatsAppOtp);
        };

        return res.status(200).json(sendWhatsAppOtp);
    } catch (error) {
        console.error("Send Order OTP Error-------->", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

const verifyOrderOTP = async (req, res) => {
    try {
        const { orderId, otp } = req.body;
        const userId = req.user.id;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Invalid Order" });
        };

        if (!otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        };

        const order = await orderModel.findOne({ _id: orderId, userId });

        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found" });
        };

        const payload = {
            userId: new ObjectId(userId),
            orderId: new ObjectId(orderId),
        };

        const otpRecord = await OTPModel.findOne(payload).sort({ createdAt: -1 });
        if (!otpRecord) {
            return res.json({ success: false, message: "Invalid OTP" });
        };

        if (parseInt(otpRecord.otp) !== parseInt(otp)) {
            return res.status(400).json({ success: false, message: "The OTP you entered is incorrect.Please verify and try again." });
        };

        if (otpRecord.expireAt.getTime() < new Date().getTime()) {
            return res.status(400).json({ success: false, message: "Your OTP has been expired." });
        };

        await OTPModel.deleteMany(payload);

        await orderModel.findByIdAndUpdate(orderId, {
            status: "confirmed",
            paymentMethod: "cod",
            paymentStatus: "pending",
        });

        return res.status(200).json({ success: true, message: "OTP verified! COD Order Confirmed" });
    } catch (error) {
        console.error("Verify Order OTP Error-------->", error);
        return res.status(400).json({ success: false, message: "OTP verification failed" });
    };
};

const updateCashOnDeliveryOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user.id;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Invalid Order" });
        };

        const order = await orderModel.findOne({ _id: new ObjectId(orderId), userId: new ObjectId(userId) });
        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found" });
        };

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
            paymentMethod: "cod",
            items: order.items,
        };

        const shipmentData = await createShipment(payload);
        console.log("CashOnDelivery shipmentData----->", shipmentData);

        if (!shipmentData.success) {
            console.log("Delhivery shipment failed:", shipmentData.message);

            order.shipping = {
                courier: "Shiprocket",
                shipmentId: "",
                awb: "",
                status: "shipment_failed",
            };

            await order.save();

            return res.status(400).json({ success: false, message: "Your Order shipment failed, please try again later." });
        };

        const shipment = shipmentData.data;
        console.log("CashOnDelivery shipment----->", shipment);

        const createAWB = await generateAWB(shipment.shipment_id);
        console.log("CashOnDelivery createAWB----->", createAWB);
        if (!createAWB.success) {
            console.log("Delhivery Create AWB failed:", createAWB.message);

            order.shipping = {
                courier: "Shiprocket",
                shipmentId: "",
                awb: "",
                status: "awb_failed",
            };

            await order.save();

            return res.status(400).json({ success: false, message: "Your Order shipment failed, please try again later." });
        };

        const pickupRequest = await requestPickup(shipment.shipment_id);
        console.log("CashOnDelivery pickupRequest----->", pickupRequest);
        if (!pickupRequest.success) {
            console.log("Delhivery shipment Request failed:", pickupRequest.message);

            order.shipping = {
                courier: "Shiprocket",
                shipmentId: "",
                awb: "",
                status: "pickup_request_failed",
            };

            await order.save();

            return res.status(400).json({ success: false, message: "Your Order shipment request failed, please try again later." });
        };

        order.status = "confirmed";
        order.paymentStatus = "pending";
        order.paymentMethod = "cod";
        order.shipping = {
            courier: "Shiprocket",
            shipmentId: shipment.shipment_id,
            awb: createAWB.data.awb_code,
            status: "Pickup Requested",
        };

        await order.save();

        return res.status(200).json({ success: true, message: "Your Order has been Confirmed" });
    } catch (error) {
        console.error("update Cash On Delivery Order Status Error-------->", error);
        return res.status(400).json({ success: false, message: "Something went Wrong, please try again later." });
    };
};

// Update order status (Admin)
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status, paymentStatus } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: "Order ID and status are required" });
        };

        const validStatuses = [
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled",
        ];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        };

        const validPaymentStatuses = ["pending", "paid", "failed"];
        if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({ success: false, message: "Invalid payment status" });
        };

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found" });
        };

        order.status = status;
        if (paymentStatus) {
            order.paymentStatus = paymentStatus;
        }
        order.updatedAt = Date.now();
        await order.save();

        return res.status(200).json({ success: true, message: "Order updated successfully", order });
    } catch (error) {
        console.error("Update Order Status Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

// Get order statistics (Admin Dashboard)
const getOrderStats = async (req, res) => {
    try {
        const totalOrders = await orderModel.countDocuments();
        const pendingOrders = await orderModel.countDocuments({
            status: "pending",
        });
        const deliveredOrders = await orderModel.countDocuments({
            status: "delivered",
        });

        // Calculate total revenue
        const revenueResult = await orderModel.aggregate([
            { $match: { status: { $in: ["delivered", "shipped", "confirmed"] } } },
            { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
        ]);

        const totalRevenue =
            revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        // Get recent orders
        const recentOrders = await orderModel
            .find({})
            .populate("userId")
            .sort({ date: -1 })
            .limit(10);

        // Monthly orders (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyOrders = await orderModel.aggregate([
            { $match: { date: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: "$amount" },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                totalOrders,
                pendingOrders,
                deliveredOrders,
                totalRevenue,
                recentOrders,
                monthlyOrders,
            },
            message: "Order statistics fetched successfully",
        });
    } catch (error) {
        console.error("Get Order Stats Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

// Delete order (Admin)
const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        };

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found", });
        };

        await orderModel.findByIdAndDelete(orderId);

        return res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
        console.error("Delete Order Error:", error);
        return res.status(400).json({ success: false, message: error.message });
    };
};

export {
    createOrder,
    getAllOrders,
    getUserOrders,
    getAdminUserOrdersDetails,
    getUserOrderById,
    updateOrderStatus,
    getOrderStats,
    deleteOrder,
    sendOrderOTP,
    verifyOrderOTP,
    updateCashOnDeliveryOrderStatus,
};
