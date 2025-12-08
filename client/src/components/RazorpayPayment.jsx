import { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { serverUrl } from "../../config";
import { FaCreditCard, FaLock, FaSpinner } from "react-icons/fa";
import { loadStripe } from "@stripe/stripe-js";
import api from "../api/axiosInstance";

// Razorpay script loader
const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

// Initialize Stripe
// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const RazorpayPayment = ({ orderId, amount, onSuccess, onCancel }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async (e) => {
        e.preventDefault();

        setIsProcessing(true);

        const scriptLoaded = await loadRazorpay();
        if (!scriptLoaded) {
            toast.error("Failed to load Razorpay. Try again.");
            setIsProcessing(false);
            return;
        };

        try {
            const response = await api.post(
                `${serverUrl}/api/payment/razorpay/create-payment-link`,
                { orderId: orderId },
            );

            const data = response.data;

            if (data.success) {
                window.location.href = data.paymentLink;
            } else {
                toast.error(data.message || "Failed to initiate payment");
                setIsProcessing(false);
                return;
            };

            // const { razorpayOrderId, amount: orderAmount, currency, name } = data;

            // const options = {
            //     key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            //     amount: orderAmount,
            //     currency: currency,
            //     name: name || "Payment",
            //     description: "Order Payment",
            //     order_id: razorpayOrderId,

            //     handler: async function (response) {
            //         const verifyRes = await api.post(
            //             `${serverUrl}/api/payment/razorpay/verify-payment`,
            //             {
        //                     orderId,
        //                     razorpay_payment_id: response.razorpay_payment_id,
        //                     razorpay_order_id: response.razorpay_order_id,
        //                     razorpay_signature: response.razorpay_signature,
            //             },
            //         );

            //         const verifyData = verifyRes.data;

            //         if (verifyData.success) {
            //             toast.success("Payment successful!");
            //             onSuccess(verifyData.paymentId);
            //         } else {
            //             toast.error("Payment verification failed");
            //         };
            //     },

            //     prefill: {
            //         email: "user@example.com",
            //         contact: "9999999999",
            //     },

            //     theme: {
            //         color: "#2563eb",
            //     },
            // };

            // const razorpay = new window.Razorpay(options);
            // razorpay.open();
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("Payment initialization failed");
        } finally {
            setIsProcessing(false);
        };
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <FaCreditCard className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Pay with Razorpay</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Amount to pay</span>
                    <span className="text-lg font-bold text-gray-900">₹{amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaLock className="w-3 h-3" />
                    <span>Your payment is secure</span>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <FaSpinner className="w-4 h-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <FaCreditCard className="w-4 h-4" />
                            Pay ₹{amount.toFixed(2)}
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

RazorpayPayment.propTypes = {
    orderId: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default RazorpayPayment;
