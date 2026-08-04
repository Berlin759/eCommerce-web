import { useState, useEffect } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { IoCloseOutline } from "react-icons/io5";
import { FaPhoneAlt, FaShieldAlt, FaArrowRight, FaEdit, FaCheckCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser, setOrderCount } from "../redux/orebiSlice";
import { serverUrl } from "../../config";
import api from "../api/axiosInstance";

const COUNTRY_CODES = [
    { code: "+91", country: "India", flag: "🇮🇳", length: 10 },
    { code: "+1", country: "US / Canada", flag: "🇺🇸", length: 10 },
    { code: "+44", country: "UK", flag: "🇬🇧", length: 10 },
    { code: "+971", country: "UAE", flag: "🇦🇪", length: 9 },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", length: 9 },
    { code: "+61", country: "Australia", flag: "🇦🇺", length: 9 },
    { code: "+974", country: "Qatar", flag: "🇶🇦", length: 8 },
    { code: "+965", country: "Kuwait", flag: "🇰🇼", length: 8 },
];

const LoginModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();

    const [countryCode, setCountryCode] = useState("+91");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [step, setStep] = useState(1); // 1: Phone input, 2: OTP verification
    const [isLoading, setIsLoading] = useState(false);
    const [errMessage, setErrMessage] = useState("");
    const [timer, setTimer] = useState(0);

    const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

    // Reset form state on modal close or open
    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setPhone("");
            setOtp(["", "", "", "", "", ""]);
            setErrMessage("");
            setTimer(0);
        }
    }, [isOpen]);

    // Timer countdown for OTP resend
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Numeric-only phone handler with max length check
    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, ""); // Allow ONLY numbers
        if (val.length <= selectedCountry.length) {
            setPhone(val);
            setErrMessage("");
        }
    };

    const handleCountryCodeChange = (e) => {
        const newCode = e.target.value;
        setCountryCode(newCode);
        setPhone(""); // Automatically clear input field on country code change
        setErrMessage("");
    };

    const isPhoneValid = phone.length === selectedCountry.length;

    // OTP Input handler
    const handleOtpChange = (element, index) => {
        const value = element.value.replace(/[^0-9]/g, "");
        if (!value && element.value !== "") return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setErrMessage("");

        // Auto focus next input
        if (value && element.nextSibling) {
            element.nextSibling.focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
            e.target.previousSibling.focus();
        }
    };

    // Fetch user order count after successful login
    const fetchUserOrderCount = async () => {
        try {
            const response = await api.get(`${serverUrl}/api/order/my-orders`);
            if (response.data?.success) {
                dispatch(setOrderCount(response.data.orders.length));
            }
        } catch (error) {
            console.error("Error fetching order count:", error);
        }
    };

    // Step 1: Send WhatsApp OTP
    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setErrMessage("");

        if (!phone) {
            setErrMessage("Please enter your phone number");
            return;
        }

        if (phone.length !== selectedCountry.length) {
            setErrMessage(`Phone number for ${selectedCountry.country} must be ${selectedCountry.length} digits`);
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${serverUrl}/api/user/send-otp`, {
                phone,
                countryCode,
            });

            if (response.data?.success) {
                toast.success(response.data.message || "OTP sent to your WhatsApp number!");
                if (response.data?.devOtp) {
                    toast(`[Dev OTP]: ${response.data.devOtp}`, { icon: "🔑", duration: 6000 });
                }
                setStep(2);
                setTimer(60); // 60s resend timer
            } else {
                setErrMessage(response.data?.message || "Failed to send OTP");
                toast.error(response.data?.message || "Failed to send OTP");
            }
        } catch (error) {
            console.error("Send OTP Error:", error);
            const msg = error.response?.data?.message || "Failed to send OTP. Please try again.";
            setErrMessage(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        setErrMessage("");

        const otpString = otp.join("");
        if (otpString.length !== 6) {
            setErrMessage("Please enter complete 6-digit OTP");
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${serverUrl}/api/user/verify-otp`, {
                phone,
                countryCode,
                otp: otpString,
            });

            if (response.data?.success) {
                localStorage.setItem("token", response.data.token);
                dispatch(addUser(response.data.user));
                await fetchUserOrderCount();

                toast.success(response.data.message || "Login successful!");
                onClose();
            } else {
                setErrMessage(response.data?.message || "Invalid OTP");
                toast.error(response.data?.message || "Invalid OTP");
            }
        } catch (error) {
            console.error("Verify OTP Error:", error);
            const msg = error.response?.data?.message || "OTP verification failed. Please try again.";
            setErrMessage(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300">
                    <div className="relative p-6 sm:p-8">
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <IoCloseOutline className="text-2xl" />
                        </button>

                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Header */}
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                            <FaPhoneAlt className="text-2xl" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            WhatsApp Login / Sign Up
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Enter your mobile number to receive verification code on WhatsApp
                                        </p>
                                    </div>

                                    {/* Form */}
                                    <form onSubmit={handleSendOtp} className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase text-gray-600 mb-2">
                                                Mobile Number
                                            </label>
                                            <div className="flex rounded-xl border border-gray-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden transition-all bg-gray-50/50">
                                                {/* Country Code Select */}
                                                <select
                                                    value={countryCode}
                                                    onChange={handleCountryCodeChange}
                                                    className="px-3 py-3 bg-gray-100 border-r border-gray-300 text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer"
                                                >
                                                    {COUNTRY_CODES.map((c) => (
                                                        <option key={c.code} value={c.code}>
                                                            {c.flag} {c.code}
                                                        </option>
                                                    ))}
                                                </select>

                                                {/* Number Input */}
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={phone}
                                                    onChange={handlePhoneChange}
                                                    placeholder={`Enter ${selectedCountry.length}-digit mobile number`}
                                                    maxLength={selectedCountry.length}
                                                    className="w-full px-4 py-3 bg-transparent text-sm text-gray-900 font-medium placeholder-gray-400 focus:outline-none"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Allowed: {selectedCountry.length} digits only
                                            </p>
                                        </div>

                                        {errMessage && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-sm text-red-600 font-medium flex items-center gap-1"
                                            >
                                                <span>⚠️</span> {errMessage}
                                            </motion.p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={!isPhoneValid || isLoading}
                                            className={`w-full py-3.5 px-4 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                                                isPhoneValid && !isLoading
                                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 cursor-pointer"
                                                    : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                            }`}
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Sending OTP...
                                                </div>
                                            ) : (
                                                <>
                                                    Get WhatsApp OTP <FaArrowRight className="text-xs" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Header */}
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                            <FaShieldAlt className="text-2xl" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            Verify OTP
                                        </h2>
                                        <div className="flex items-center justify-center gap-2 mt-1 text-sm text-gray-600">
                                            <span>Sent to <strong>{countryCode} {phone}</strong></span>
                                            <button
                                                onClick={() => {
                                                    setStep(1);
                                                    setErrMessage("");
                                                }}
                                                className="text-emerald-600 hover:underline flex items-center gap-1 font-medium"
                                            >
                                                <FaEdit className="text-xs" /> Edit
                                            </button>
                                        </div>
                                    </div>

                                    {/* OTP Input Boxes */}
                                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                                        <div className="flex justify-center gap-2 sm:gap-3">
                                            {otp.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(e.target, index)}
                                                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                                    className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl focus:outline-none transition-all bg-gray-50"
                                                />
                                            ))}
                                        </div>

                                        {errMessage && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-sm text-red-600 font-medium text-center flex items-center justify-center gap-1"
                                            >
                                                <span>⚠️</span> {errMessage}
                                            </motion.p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Verifying...
                                                </div>
                                            ) : (
                                                <>
                                                    Verify & Login <FaCheckCircle className="text-sm" />
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    {/* Resend Timer */}
                                    <div className="mt-6 text-center text-sm text-gray-500">
                                        {timer > 0 ? (
                                            <p>Resend OTP in <span className="font-semibold text-emerald-600">{timer}s</span></p>
                                        ) : (
                                            <button
                                                onClick={handleSendOtp}
                                                disabled={isLoading}
                                                className="text-emerald-600 hover:underline font-semibold"
                                            >
                                                Resend OTP via WhatsApp
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default LoginModal;
