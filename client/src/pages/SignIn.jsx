import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { serverUrl } from "../../config";
import { useDispatch } from "react-redux";
import { addUser, setOrderCount } from "../redux/orebiSlice";
import {
    FaPhoneAlt,
    FaShieldAlt,
    FaArrowRight,
    FaCheckCircle,
    FaEdit,
} from "react-icons/fa";
import Container from "../components/Container";
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

const SignIn = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // ================= Phone OTP State =================
    const [countryCode, setCountryCode] = useState("+91");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP
    const [isLoading, setIsLoading] = useState(false);
    const [errMessage, setErrMessage] = useState("");
    const [timer, setTimer] = useState(0);

    const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

    /* ============= PRESERVED EMAIL/PASSWORD CODE (COMMITTED OUT) =============
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errEmail, setErrEmail] = useState("");
    const [errPassword, setErrPassword] = useState("");

    const handleEmail = (e) => {
        setEmail(e.target.value);
        setErrEmail("");
    };

    const handlePassword = (e) => {
        setPassword(e.target.value);
        setErrPassword("");
    };

    const handleSignInEmailPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrEmail("");
        setErrPassword("");

        if (!email) {
            setErrEmail("Enter your email");
            setIsLoading(false);
            return;
        }

        if (!password) {
            setErrPassword("Enter your password");
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(serverUrl + "/api/user/login", {
                email,
                password,
            });
            const data = response?.data;
            if (data?.success) {
                localStorage.setItem("token", data?.token);
                await fetchUserOrderCount();
                toast.success(data?.message);
                navigate("/");
            } else {
                toast.error(data?.message);
            }
        } catch (error) {
            console.error("User login error", error);
            toast.error(error?.response?.data?.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };
    ======================================================================== */

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/");
        }
    }, [navigate]);

    // Timer for OTP resend
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Handle Phone Input (Only numeric characters allowed)
    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, "");
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

    // OTP Change handler
    const handleOtpChange = (element, index) => {
        const value = element.value.replace(/[^0-9]/g, "");
        if (!value && element.value !== "") return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setErrMessage("");

        if (value && element.nextSibling) {
            element.nextSibling.focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
            e.target.previousSibling.focus();
        }
    };

    // Fetch user order count
    const fetchUserOrderCount = async () => {
        try {
            const response = await api.get(`${serverUrl}/api/order/my-orders`);
            const data = response.data;
            if (data.success) {
                dispatch(setOrderCount(data.orders.length));
            }
        } catch (error) {
            console.error("Error fetching order count:", error);
        }
    };

    // Send WhatsApp OTP
    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setErrMessage("");

        if (!phone) {
            setErrMessage("Please enter your mobile number");
            return;
        }

        if (phone.length !== selectedCountry.length) {
            setErrMessage(`Mobile number must be exactly ${selectedCountry.length} digits`);
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${serverUrl}/api/user/send-otp`, {
                phone,
                countryCode,
            });

            console.log("response---111---->", response);
            console.log("response.data---111---->", response.data);

            if (response.data?.success) {
                toast.success(response.data.message || "OTP sent to your WhatsApp number!");
                setStep(2);
                setTimer(60);
            } else {
                setErrMessage(response.data?.message || "Failed to send OTP");
                toast.error(response.data?.message || "Failed to send OTP");
            }
        } catch (error) {
            console.error("Send OTP Error:", error);
            console.error("Send OTP Error Response 111:", error.response);
            console.error("Send OTP Error Response Data 111:", error.response?.data);
            const msg = error.response?.data?.message || "Failed to send OTP";
            setErrMessage(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Verify OTP & Login
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
                navigate("/");
            } else {
                setErrMessage(response.data?.message || "Invalid OTP");
                toast.error(response.data?.message || "Invalid OTP");
            }
        } catch (error) {
            console.error("Verify OTP Error:", error);
            const msg = error.response?.data?.message || "OTP verification failed";
            setErrMessage(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Container>
                <div className="sm:w-[450px] w-full mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="bg-white rounded-2xl shadow-xl p-8"
                    >
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="signInStep1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Header */}
                                    <div className="text-center mb-8">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                            className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100"
                                        >
                                            <FaPhoneAlt className="text-2xl" />
                                        </motion.div>
                                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                            Welcome Back
                                        </h1>
                                        <p className="text-gray-600">
                                            Enter your mobile number to sign in via WhatsApp OTP
                                        </p>
                                    </div>

                                    {/* Phone Form */}
                                    <form onSubmit={handleSendOtp} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mobile Number
                                            </label>
                                            <div className="flex rounded-lg border border-gray-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden transition-colors">
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

                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={phone}
                                                    onChange={handlePhoneChange}
                                                    placeholder={`Enter ${selectedCountry.length}-digit number`}
                                                    maxLength={selectedCountry.length}
                                                    className="w-full px-4 py-3 bg-transparent text-sm text-gray-900 font-medium placeholder-gray-400 focus:outline-none"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Numbers only (max {selectedCountry.length} digits)
                                            </p>
                                        </div>

                                        {errMessage && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-sm text-red-600 font-medium"
                                            >
                                                ⚠️ {errMessage}
                                            </motion.p>
                                        )}

                                        <motion.button
                                            whileHover={{ scale: isPhoneValid && !isLoading ? 1.02 : 1 }}
                                            whileTap={{ scale: isPhoneValid && !isLoading ? 0.98 : 1 }}
                                            type="submit"
                                            disabled={!isPhoneValid || isLoading}
                                            className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-medium rounded-lg transition-all duration-200 ${
                                                isPhoneValid && !isLoading
                                                    ? "text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-md shadow-emerald-600/20 cursor-pointer"
                                                    : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                            }`}
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Sending OTP...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    Get WhatsApp OTP
                                                    <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            )}
                                        </motion.button>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="signInStep2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Header */}
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                            <FaShieldAlt className="text-2xl" />
                                        </div>
                                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                            Enter OTP
                                        </h1>
                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
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

                                    {/* OTP Form */}
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
                                                    className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg focus:outline-none transition-all bg-gray-50"
                                                />
                                            ))}
                                        </div>

                                        {errMessage && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-sm text-red-600 font-medium text-center"
                                            >
                                                ⚠️ {errMessage}
                                            </motion.p>
                                        )}

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            disabled={isLoading}
                                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-emerald-600/20"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Verifying...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    Verify & Sign In
                                                    <FaCheckCircle className="w-4 h-4" />
                                                </div>
                                            )}
                                        </motion.button>
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

                        {/* PRESERVED EMAIL/PASSWORD FORM MARKUP (COMMITTED OUT) */}
                        {/*
                        <form onSubmit={handleSignInEmailPassword} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input id="email" type="email" value={email} onChange={handleEmail} placeholder="Enter your email" />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={handlePassword} placeholder="Enter your password" />
                            </div>
                            <button type="submit">Sign In</button>
                        </form>
                        */}
                    </motion.div>
                </div>
            </Container>
        </div>
    );
};

export default SignIn;
