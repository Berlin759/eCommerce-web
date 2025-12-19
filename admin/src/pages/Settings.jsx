import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { FaCog, FaUser, FaDatabase, FaShieldVirus, FaBell } from "react-icons/fa";
import Title from "../components/ui/title";
import Input, { Label } from "../components/ui/input";
import { serverUrl } from "../../config";
import SkeletonLoader from "../components/SkeletonLoader";
import { passwordValidation } from "../utils/general.lib";
import api from "../api/axiosInstance";

const Settings = ({ token }) => {
    const [isSettingLoading, setSettingLoading] = useState(false);
    const [isPercentageLoading, setPercentageLoading] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [discountedPercentage, setDiscountedPercentage] = useState(0);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Fetch all setting
    const fetchSetting = async () => {
        try {
            setSettingLoading(true);
            const response = await api.get(`${serverUrl}/api/setting/list`);

            const data = response.data;
            if (data.success) {
                setDiscountedPercentage(data.setting.discountedPercentage);
            } else {
                toast.error(data.message || "Failed to fetch settings");
            };
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setSettingLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        try {
            e.preventDefault();

            if (!oldPassword) {
                toast.error("Please Enter Old password");
                return;
            };

            if (!newPassword) {
                toast.error("Please Enter New password");
                return;
            };

            if (!confirmPassword) {
                toast.error("Please Enter Confirm password");
                return;
            };

            if (newPassword === oldPassword) {
                toast.error("Your new password must be different from your old password!");
                return;
            };

            if (newPassword !== confirmPassword) {
                toast.error("New passwords and Confirm password do not match!");
                return;
            };

            const validatePassword = passwordValidation(newPassword);
            if (validatePassword.flag === 0) {
                toast.error(validatePassword.msg);
                return;
            };

            const payload = {
                newPassword: newPassword,
                oldPassword: oldPassword,
            };

            setLoading(true);

            const response = await axios.put(
                `${serverUrl}/api/setting/change-password`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = response?.data;
            if (data?.success) {
                toast.success(data?.message);
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                toast.error(data?.message);
            };
        } catch (error) {
            console.error("Change Password Error-------->", error);
            toast.error(error?.message);
        } finally {
            setLoading(false);
        };
    };

    const handleOnlinePaymentDiscount = async (e) => {
        try {
            e.preventDefault();

            if (!discountedPercentage || discountedPercentage === "") {
                toast.error("Please Enter Discounted Percentage");
                return;
            };

            const payload = {
                discountedPercentage: discountedPercentage,
            };

            setPercentageLoading(true);

            const response = await axios.put(
                `${serverUrl}/api/setting/update-discounted-percentage`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = response?.data;
            if (data?.success) {
                toast.success(data?.message);
            } else {
                toast.error(data?.message);
            };
        } catch (error) {
            console.error("update discounted percentage Error-------->", error);
            toast.error(error?.message);
        } finally {
            setPercentageLoading(false);
        };
    };

    const settingsCategories = [
        {
            title: "General Settings",
            icon: <FaCog />,
            color: "blue",
            settings: [
                { label: "Site Name", value: "ECommerce Shopping", type: "text" },
                {
                    label: "Site Description",
                    value: "Modern e-commerce platform",
                    type: "text",
                },
                { label: "Default Currency", value: "INR", type: "select" },
                { label: "Timezone", value: "UTC-5", type: "select" },
            ],
        },
        {
            title: "User Management",
            icon: <FaUser />,
            color: "green",
            settings: [
                { label: "Allow User Registration", value: true, type: "toggle" },
                { label: "Email Verification Required", value: true, type: "toggle" },
                { label: "Default User Role", value: "Customer", type: "select" },
                { label: "Password Minimum Length", value: "8", type: "number" },
            ],
        },
        {
            title: "Security",
            icon: <FaShieldVirus />,
            color: "red",
            settings: [
                { label: "Two-Factor Authentication", value: false, type: "toggle" },
                { label: "Session Timeout (minutes)", value: "30", type: "number" },
                { label: "Failed Login Attempts", value: "5", type: "number" },
                { label: "IP Whitelist Enabled", value: false, type: "toggle" },
            ],
        },
        {
            title: "Notifications",
            icon: <FaBell />,
            color: "purple",
            settings: [
                { label: "Email Notifications", value: true, type: "toggle" },
                { label: "Order Notifications", value: true, type: "toggle" },
                { label: "Low Stock Alerts", value: true, type: "toggle" },
                { label: "System Maintenance Alerts", value: false, type: "toggle" },
            ],
        },
    ];

    const renderSettingInput = (setting) => {
        switch (setting.type) {
            case "toggle":
                return (
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked={setting.value}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                );
            case "select":
                return (
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>{setting.value}</option>
                    </select>
                );
            case "number":
                return (
                    <input
                        type="number"
                        defaultValue={setting.value}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        defaultValue={setting.value}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                );
        }
    };

    useEffect(() => {
        fetchSetting();
    }, []);

    if (isSettingLoading) {
        return (
            <div>
                <Title>Setting Details</Title>
                <div className="mt-6">
                    <SkeletonLoader type="settings" />
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-gray-600">
                    Manage your system configuration and preferences
                </p>
            </div>

            {/* Online Payment Discount Setting */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Online Payment Discount Percentage</h3>
                </div>
                <div className="p-6">
                    <form
                        onSubmit={handleOnlinePaymentDiscount}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <div className="flex flex-col relative">
                            <Label htmlFor="discountedPercentage">
                                Discount Percentage(in %)
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0"
                                name="discountedPercentage"
                                value={discountedPercentage}
                                onChange={(e) => setDiscountedPercentage(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div className="md:col-span-3 flex justify-end mt-4">
                            <button
                                type="submit"
                                disabled={isPercentageLoading}
                                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                            >
                                {isPercentageLoading ? "Submitting..." : "Update Percentage"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                </div>
                <div className="p-6">
                    <form
                        onSubmit={handlePasswordChange}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <div className="flex flex-col relative">
                            <label className="text-sm font-medium mb-1">Old Password</label>
                            <input
                                type={showOldPassword ? "text" : "password"}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="absolute inset-y-25 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                            >
                                {showOldPassword ? (
                                    <svg
                                        className="h-5 w-5 text-gray-400 hover:text-gray-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="h-5 w-5 text-gray-400 hover:text-gray-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <div className="flex flex-col relative">
                            <label className="text-sm font-medium mb-1">New Password</label>
                            <input
                                type={showNewPassword ? "text" : "password"}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute inset-y-25 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                            >
                                {showNewPassword ? (
                                    <svg
                                        className="h-5 w-5 text-gray-400 hover:text-gray-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="h-5 w-5 text-gray-400 hover:text-gray-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <div className="flex flex-col relative">
                            <label className="text-sm font-medium mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-25 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                            >
                                {showConfirmPassword ? (
                                    <svg
                                        className="h-5 w-5 text-gray-400 hover:text-gray-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="h-5 w-5 text-gray-400 hover:text-gray-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <div className="md:col-span-3 flex justify-end mt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                            >
                                {isLoading ? "Submitting..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Settings Categories */}
            {/* <div className="space-y-6">
                {settingsCategories.map((category, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-sm border border-gray-100"
                    >
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 bg-${category.color}-100 rounded-lg`}>
                                    <span className={`text-${category.color}-600`}>
                                        {category.icon}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {category.title}
                                </h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {category.settings.map((setting, settingIndex) => (
                                    <div
                                        key={settingIndex}
                                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {setting.label}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Configure {setting.label.toLowerCase()}
                                            </p>
                                        </div>
                                        {renderSettingInput(setting)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div> */}

            {/* Save Settings */}
            {/* <div className="mt-8 flex justify-end gap-4">
                <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Reset to Defaults
                </button>
                <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                    Save Changes
                </button>
            </div> */}
        </div>
    );
};

export default Settings;
