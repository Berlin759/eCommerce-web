import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import toast from "react-hot-toast";
import {
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaUndo,
    FaMapMarkerAlt,
    FaUser,
    FaEnvelope,
    FaPhone,
} from "react-icons/fa";
import { serverUrl } from "../../config";
import api from "../api/axiosInstance";

const Checkout = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const paymentStatusUI = {
        pending: {
            bg: "bg-yellow-50",
            border: "border-yellow-200",
            iconColor: "text-yellow-600",
            icon: FaClock,
            title: "Payment Pending",
            message: "Order payment is still pending",
        },
        failed: {
            bg: "bg-red-50",
            border: "border-red-200",
            iconColor: "text-red-600",
            icon: FaTimesCircle,
            title: "Payment Failed",
            message: "Order payment has failed",
        },
        refunded: {
            bg: "bg-blue-50",
            border: "border-blue-200",
            iconColor: "text-blue-600",
            icon: FaUndo,
            title: "Payment Refunded",
            message: "Your payment has been refunded successfully",
        },
        paid: {
            bg: "bg-green-50",
            border: "border-green-200",
            iconColor: "text-green-600",
            icon: FaCheckCircle,
            title: "Payment Completed",
            message: "Your payment has been processed successfully",
        },
    };

    const fetchOrderDetails = useCallback(async () => {
        try {
            const response = await api.get(`${serverUrl}/api/order/admin/orderDetails/${orderId}`);
            const data = response.data;
            if (data.success) {
                setOrder(data.order);
            } else {
                toast.error("Order not found");
                navigate("/orders");
            };
        } catch (error) {
            console.error("Error fetching order:", error);
            if (error.response && error.response.data) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to load order details");
            };
            navigate("/orders");
        } finally {
            setLoading(false);
        };
    }, [orderId, navigate]);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId, fetchOrderDetails]);

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
    };

    const status = paymentStatusUI[order.paymentStatus] || null;
    const StatusIcon = status?.icon;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="py-8 px-4">
                    <div className="flex items-center gap-3 mb-4">
                        <FaCheckCircle className="w-8 h-8 text-green-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Order Confirmation
                            </h1>
                            <p className="text-gray-600">Order ID: #{order._id}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-8">
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
                                        {order.status.charAt(0).toUpperCase() +
                                            order.status.slice(1)}
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
                                        {order.paymentStatus.charAt(0).toUpperCase() +
                                            order.paymentStatus.slice(1)}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FaClock className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">
                                        Placed on {new Date(order.date).toLocaleDateString()}
                                    </span>
                                </div>
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
                                <div className="flex justify-between text-lg font-semibold">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-gray-900">
                                        <PriceFormat amount={order.amount} />
                                    </span>
                                </div>
                            </div>

                            {status && (
                                <div className={`p-4 rounded-lg border ${status.bg} ${status.border}`}>
                                    <div className="flex items-center gap-3">
                                        <StatusIcon className={`w-6 h-6 ${status.iconColor}`} />
                                        <div>
                                            <h4 className="font-semibold">{status.title}</h4>
                                            <p className="text-sm">{status.message}</p>
                                        </div>
                                    </div>
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
            </div>
        </div>
    );
};

export default Checkout;
