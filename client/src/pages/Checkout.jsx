import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import RazorpayPayment from "../components/RazorpayPayment";
import toast from "react-hot-toast";
import {
    FaCheckCircle,
    FaCreditCard,
    FaMoneyBillWave,
    FaClock,
    FaMapMarkerAlt,
    FaUser,
    FaEnvelope,
    FaPhone,
    FaArrowLeft,
} from "react-icons/fa";
import { serverUrl } from "../../config";
import api from "../api/axiosInstance";
import { calculateDiscountedPercentage } from "../helpers/stockManager";

const Checkout = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [paymentStep, setPaymentStep] = useState("selection");
    const [chosenMethod, setChosenMethod] = useState(null);
    const [otpModal, setOtpModal] = useState(false);
    const [otp, setOtp] = useState("")
    const [otpSent, setOtpSent] = useState(false);
    const [tracking, setTracking] = useState(null);
    const [trackingLoading, setTrackingLoading] = useState(false);

    const [orderCancelModal, setOrderCancelModal] = useState(false);
    const [cancelOrderLoading, setCancelOrderLoading] = useState(false);

    const [ratingModal, setRatingModal] = useState(false);
    const [isRatingAdd, setIsRatingAdd] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [rating, setRating] = useState(0);
    const [description, setDescription] = useState("");

    const fetchOrderDetails = useCallback(async () => {
        try {
            const response = await api.get(`${serverUrl}/api/order/user/${orderId}`);
            const data = response.data;
            if (data.success) {
                const orderAmount = data.order.amount;
                const disAmount = data.order.discountAmount;
                const discount_amount_count = orderAmount - disAmount;

                const percentageCount = calculateDiscountedPercentage(orderAmount, discount_amount_count);

                setOrder(data.order);
                setDiscountPercentage(percentageCount);
                setDiscountAmount(discount_amount_count);
                setIsRatingAdd(data.order.alreadyRatingAdd);
            } else {
                toast.error("Order not found");
                navigate("/orders");
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            toast.error("Failed to load order details");
            navigate("/orders");
        } finally {
            setLoading(false);
        }
    }, [orderId, navigate]);

    const handleCashOnDelivery = async () => {
        setChosenMethod("cod");
        setPaymentStep("cod");

        try {
            const response = await api.post(`${serverUrl}/api/order/updateCashOnDelivery`, {
                orderId: orderId,
            });

            const data = response.data;
            if (data.success) {
                toast.success(data.message || "Your Order has been Confirmed");
                navigate(`/payment-success?order_id=${orderId}`);
            } else {
                setChosenMethod("");
                setPaymentStep("selection");
                console.error("handleCashOnDelivery error--->", data.message);
                toast.error(data.message || "Failed to Cash On Delivery");
            };
        } catch (error) {
            setChosenMethod("");
            setPaymentStep("selection");
            console.error("Failed to Cash On Delivery:", error);
            toast.error("Failed to Cash On Delivery");
        };
    };

    const handleOrderCancel = async () => {
        try {
            setCancelOrderLoading(true);

            const response = await api.post(`${serverUrl}/api/order/cancel-order`, {
                orderId: orderId,
            });

            setOrderCancelModal(false);

            const data = response.data;
            if (data.success) {
                toast.success(data.message || "Your Order has been cancel successfully!");
                navigate("/orders");
            } else {
                console.error("handleOrderCancel error--->", data.message);
                toast.error(data.message || "Failed to Order Cancel");
            };
        } catch (error) {
            console.error("Failed to Order Cancel:", error);

            if (error.response && error.response.data) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to Order Cancel");
            };
        } finally {
            setCancelOrderLoading(false);
        };
    };

    const handleOTPSend = async () => {
        try {
            const response = await api.post(`${serverUrl}/api/order/send-otp`, {
                orderId: orderId,
                phone: order.address.phone,
            });

            const data = response.data;
            if (data.success) {
                toast.success(data.message);
                setOtpModal(true);
                setOtpSent(true);
            } else {
                console.error("handleOTPSend error--->", data.message);
                toast.error(data.message || "Failed to send OTP");
            };
        } catch (error) {
            console.error("Error handle OTP Send:", error);
            toast.error("Error sending OTP");
        };
    };

    const handleVerifyOTP = async () => {
        try {
            const response = await api.post(`${serverUrl}/api/order/verify-otp`, {
                orderId: orderId,
                otp: otp,
            });

            const data = response.data;
            if (data.success) {
                toast.success("OTP verified! COD Order Confirmed");
                navigate(`/payment-success?order_id=${orderId}`);
            } else {
                console.error("handleVerifyOTP error--->", data.message);
                toast.error(data.message || "OTP verification failed");
            };
        } catch (error) {
            console.error("Error handle Verify OTP---------->", error);
            toast.error("OTP verification failed");
        };
    };

    const fetchOrderTracking = async () => {
        try {
            setTrackingLoading(true);

            const response = await api.post(`${serverUrl}/api/shipment/order-track`, {
                orderId: orderId,
            });

            const data = response.data;

            if (data.success) {
                setTracking(data.shipmentDetails);
            } else {
                console.error("Error fetching shipment:", error);
                toast.error("Failed to load shipment details");
            };
        } catch (err) {
            console.error("Error handle fetching shipment:", err);
            toast.error("Error handle fetching shipment details");
        } finally {
            setTrackingLoading(false);
        };
    };

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();

            if (order?.status === "shipped" || order?.status === "delivered") {
                fetchOrderTracking();
            };
        };
    }, [orderId, fetchOrderDetails]);

    const handleRazorpaySuccess = (paymentIntentId) => {
        navigate(`/payment-success?order_id=${orderId}&payment_intent=${paymentIntentId}`);
    };

    const handleRazorpayCancel = () => {
        setPaymentStep("selection");
    };

    const openRatingModal = (productId) => {
        setSelectedProduct(productId);
        setRating(0);
        setDescription("");
        setRatingModal(true);
    };

    const submitRating = async () => {
        try {
            const response = await api.post(`${serverUrl}/api/rating/add`, {
                orderId: orderId,
                productId: selectedProduct,
                rating: rating,
                description: description,
            });

            const data = response.data;
            if (data.success) {
                toast.success("Rating submitted successfully");
                setRating(0);
                setDescription("");
                setSelectedProduct(null);
                setRatingModal(false);
                setIsRatingAdd(true);
            } else {
                console.error("submitRating error--->", data.message);
                toast.error(data.message || "Submit Rating failed");
            };
        } catch (error) {
            console.error("Error Submit Rating---------->", error);
            toast.error("Failed to submit rating");
        };
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "confirmed":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "shipped":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "delivered":
                return "bg-green-100 text-green-800 border-green-200";
            case "cancelled":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "paid":
                return "bg-green-100 text-green-800 border-green-200";
            case "failed":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Order Not Found
                    </h2>
                    <p className="text-gray-600 mb-4">
                        The requested order could not be found.
                    </p>
                    <button
                        onClick={() => navigate("/orders")}
                        className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
                    >
                        View All Orders
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <Container className="py-8">
                    <div className="flex items-center gap-3 mb-4">
                        <FaCheckCircle className="w-8 h-8 text-green-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Order Confirmation
                            </h1>
                            <p className="text-gray-600">Order ID: #{order._id}</p>
                        </div>
                    </div>
                </Container>
            </div>

            <Container className="py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Status */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Order Status
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Order Status:
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                            order.status
                                        )}`}
                                    >
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Payment:
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(
                                            order.paymentStatus
                                        )}`}
                                    >
                                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                    </span>
                                </div>
                                {order.paymentMethod && (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-700">
                                            Payment Method:
                                        </span>
                                        <span
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200"
                                        >
                                            {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                                        </span>
                                    </div>
                                )}
                                {order.status !== "cancelled" && (
                                    <div className="flex items-center space-x-2">
                                        <FaClock className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-600">
                                            Placed on {new Date(order.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Order Items
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {order.items.map((item, index) => (
                                    <div key={index} className="p-6 flex items-center space-x-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.image && (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-medium text-gray-900 truncate">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Quantity: {item.quantity}
                                            </p>
                                        </div>
                                        {order.status === "delivered" && !isRatingAdd && (
                                            <div className="flex-1 min-w-0">
                                                <button
                                                    onClick={() => openRatingModal(order.item.productId)}
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    Rate Product
                                                </button>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <div className="text-lg font-semibold text-gray-900">
                                                <PriceFormat amount={item.price} />
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total:{" "}
                                                <PriceFormat amount={item.price * item.quantity} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FaMapMarkerAlt className="w-5 h-5" />
                                Delivery Address
                            </h2>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FaUser className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-900">
                                        {order.address.firstName} {order.address.lastName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaEnvelope className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">{order.address.email}</span>
                                </div>
                                {order.address.phone && (
                                    <div className="flex items-center gap-2">
                                        <FaPhone className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-600">{order.address.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-start gap-2">
                                    <FaMapMarkerAlt className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <div className="text-gray-600">
                                        <p>{order.address.street}</p>
                                        <p>
                                            {order.address.city}, {order.address.state}{" "}
                                            {order.address.zipcode}
                                        </p>
                                        <p>{order.address.country}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Tracking */}
                        {order?.shipping && order?.shipping?.waybill && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <FaMapMarkerAlt className="w-5 h-5" />
                                    Order Tracking
                                </h2>

                                {trackingLoading && (
                                    <p className="text-gray-500">Fetching tracking updates...</p>
                                )}

                                {!tracking && !trackingLoading && (
                                    <p className="text-gray-500">Tracking will be available once shipped</p>
                                )}

                                {tracking && (
                                    <>
                                        <p className="text-sm text-gray-600 mb-4">
                                            <strong>AWB:</strong> {tracking.waybill}
                                        </p>

                                        <div className="relative border-l-2 border-gray-300 pl-6 space-y-6">
                                            {tracking.history.map((step, index) => (
                                                <div key={index} className="relative">
                                                    <span className="absolute -left-3 top-1 w-4 h-4 bg-blue-600 rounded-full"></span>

                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {step.status}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {step.location}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(step.time).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 text-sm font-semibold text-green-700">
                                            Current Status: {tracking.status}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Payment Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                Payment
                            </h2>

                            {/* Order Summary */}
                            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Subtotal ({order.items.length} items)
                                    </span>
                                    <span className="font-medium">
                                        <PriceFormat amount={order.amount} />
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-medium text-green-600">Free</span>
                                </div>
                                {order.paymentMethod === "online" && (
                                    <div className="flex justify-between text-lg font-semibold">
                                        <span className="text-gray-900">discount ({discountPercentage}% off)</span>
                                        <span className="text-gray-900">
                                            <PriceFormat amount={discountAmount} />
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-semibold">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-gray-900">
                                        <PriceFormat amount={order.paymentMethod === "online" ? order.discountAmount : order.amount} />
                                    </span>
                                </div>
                            </div>

                            {/* Payment Options */}
                            {order.paymentStatus === "pending" && order.paymentMethod === "" && (
                                <div className="space-y-4">
                                    {paymentStep === "selection" && (
                                        <>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                                Choose Payment Method
                                            </h3>

                                            <button
                                                onClick={() => {
                                                    setChosenMethod("online");
                                                    setPaymentStep("online");
                                                }}
                                                className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                            >
                                                <FaCreditCard className="w-5 h-5" />
                                                Pay Online <span className="font-bold">({order.onlinePaydisPercentage}% Off)</span>
                                            </button>

                                            <button
                                                onClick={handleCashOnDelivery}
                                                className="w-full flex items-center justify-center gap-3 bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                            >
                                                <FaMoneyBillWave className="w-5 h-5" />
                                                Cash on Delivery
                                            </button>
                                        </>
                                    )}

                                    {paymentStep === "online" && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <button
                                                    onClick={handleRazorpayCancel}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <FaArrowLeft className="w-4 h-4 text-gray-600" />
                                                </button>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Payment Details
                                                </h3>
                                            </div>

                                            <RazorpayPayment
                                                orderId={orderId}
                                                amount={order.amount}
                                                onlinePayDisPercentage={order.onlinePaydisPercentage}
                                                onSuccess={handleRazorpaySuccess}
                                                onCancel={handleRazorpayCancel}
                                            />
                                        </div>
                                    )}

                                    {paymentStep === "cod" && (
                                        <div className="space-y-4">
                                            {/* <button
                                                onClick={handleOTPSend}
                                                className="w-full bg-green-600 text-white py-3 rounded-lg"
                                            >
                                                Send OTP
                                            </button>

                                            <button
                                                onClick={() => setPaymentStep("selection")}
                                                className="w-full bg-gray-200 py-3 rounded-lg"
                                            >
                                                Back
                                            </button> */}
                                        </div>
                                    )}
                                </div>
                            )}


                            {order.paymentStatus === "pending" && order.status !== "cancelled" && order.paymentMethod === "cod" && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FaMoneyBillWave className="w-6 h-6 text-green-600" />
                                        <div>
                                            <h4 className="font-semibold text-green-800">
                                                Cash on Delivery
                                            </h4>
                                            <p className="text-sm text-green-700">
                                                Pay when your order is delivered
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {order.paymentStatus === "paid" && order.status !== "cancelled" && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FaCheckCircle className="w-6 h-6 text-green-600" />
                                        <div>
                                            <h4 className="font-semibold text-green-800">
                                                Payment Completed
                                            </h4>
                                            <p className="text-sm text-green-700">
                                                Your payment has been processed successfully
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {order.status === "cancelled" && (
                                <div className="p-4 bg-red-500 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h4 className="font-semibold text-white">
                                                Your order has been cancelled.
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {otpModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-white p-6 rounded-lg shadow-lg w-80">
                                        <h2 className="text-lg font-semibold mb-3">Verify OTP</h2>

                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="Please Enter OTP"
                                            className="w-full border p-2 rounded-lg mb-4"
                                        />

                                        <button
                                            onClick={handleVerifyOTP}
                                            className="w-full bg-green-600 text-white py-2 rounded-lg mb-2"
                                        >
                                            Verify OTP
                                        </button>

                                        <button
                                            onClick={() => setOtpModal(false)}
                                            className="w-full bg-gray-200 py-2 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {order.status === "confirmed" && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={() => setOrderCancelModal(true)}
                                        className="w-full bg-red-500 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                                    >
                                        Cancel Order
                                    </button>
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => navigate("/orders")}
                                    className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    View All Orders
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Rating Modal */}
                <AnimatePresence>
                    {ratingModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white w-full max-w-md rounded-xl shadow-xl p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Rate Product
                                    </h2>
                                    <button
                                        onClick={() => setRatingModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Rating Stars */}
                                <div className="flex justify-center gap-2 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className={`text-3xl transition ${star <= rating ? "text-yellow-400" : "text-gray-300"
                                                }`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>

                                {/* Review Text */}
                                <textarea
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Write your review (optional)"
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
                                />

                                {/* Footer */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setRatingModal(false)}
                                        className="w-1/2 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitRating}
                                        disabled={!rating}
                                        className="w-1/2 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Order Cancel Modal */}
                <AnimatePresence>
                    {orderCancelModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white w-full max-w-md rounded-xl shadow-xl p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-center items-center mb-4">
                                    <h2 className="text-lg font-semibold text-red-900">
                                        Order Cancellation Confirmation
                                    </h2>
                                </div>

                                <h2 className="mb-4">
                                    <span className="text-lg font-semibold text-balck-900">! Are you sure,</span> you have cancel this order?
                                </h2>

                                {/* Footer */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setOrderCancelModal(false)}
                                        className="w-1/2 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleOrderCancel}
                                        disabled={cancelOrderLoading}
                                        className="w-1/2 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Container>
        </div>
    );
};

export default Checkout;
