import { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { FaCreditCard, FaLock, FaSpinner } from "react-icons/fa";
import { serverUrl } from "../../config";
import api from "../api/axiosInstance";
import { calculateDiscountedPrice } from "../helpers/stockManager";
import PriceFormat from "../components/PriceFormat";

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

const RazorpayPayment = ({ orderId, amount, onlinePayDisPercentage, onSuccess, onCancel }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const finalAmount = onlinePayDisPercentage > 0 ? calculateDiscountedPrice(amount, onlinePayDisPercentage).remainingAmount : amount;

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
                {
                    orderId: orderId,
                    finalAmount: finalAmount,
                },
            );

            const data = response.data;

            // if (data.success) {
            //     window.location.href = data.paymentLink;
            // } else {
            //     toast.error(data.message || "Failed to initiate payment");
            //     setIsProcessing(false);
            //     return;
            // };

            const { razorpayOrderId, amount: orderAmount, currency, name } = data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderAmount,
                currency: currency,
                name: name || "Payment",
                description: `Payment for Order #${orderId.slice(-8).toUpperCase()}`,
                order_id: razorpayOrderId,

                handler: async function (response) {
                    const verifyRes = await api.post(
                        `${serverUrl}/api/payment/razorpay/verify-payment`,
                        {
                            orderId,
                            orderAmount: orderAmount,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        },
                    );

                    if (verifyRes.data.success) {
                        // toast.success("Payment successful!");
                        onSuccess(response.razorpay_payment_id);
                    } else {
                        toast.error("Payment verification failed");
                    };
                },

                prefill: {
                    email: "berlin@gmail.com",
                    contact: "Berlin@123456",
                },

                method: {
                    upi: true,
                    card: true,
                    netbanking: true,
                    wallet: true,
                    bank_transfer: true,

                    emi: false,
                    paylater: false,
                    cardless_emi: false,
                },

                theme: {
                    color: "#2563eb",
                },
            };

            new window.Razorpay(options).open();

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
                    <span className="text-lg font-bold text-gray-900">
                        <PriceFormat amount={amount} />
                    </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{onlinePayDisPercentage}% off</span>
                    <span className="text-lg font-bold text-gray-900">
                        <PriceFormat amount={calculateDiscountedPrice(amount, onlinePayDisPercentage).discountAmount} />
                    </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Final Amount to pay</span>
                    <span className="text-lg font-bold text-gray-900">
                        <PriceFormat amount={finalAmount} />
                    </span>
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
                            Pay <PriceFormat amount={finalAmount} />
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
