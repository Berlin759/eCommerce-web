import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";
import { serverUrl } from "../../config";

const PRESET_LABELS = ["Home", "Work", "Hometown"];

const EditAddressModal = ({ address = {}, onClose, onSuccess }) => {
    const userInfo = useSelector((state) => state.orebiReducer.userInfo);
    const isEdit = Boolean(address && address._id);

    const initialLabel = address.label || "";
    const isCustomLabel = initialLabel && !PRESET_LABELS.includes(initialLabel);

    const [selectedType, setSelectedType] = useState(
        isCustomLabel ? "Other" : initialLabel
    );
    const [customLabel, setCustomLabel] = useState(isCustomLabel ? initialLabel : "");

    const initialPhone = userInfo?.phone || address.phone || "";

    const [form, setForm] = useState({
        label: initialLabel,
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        zipCode: address.zipCode || "",
        country: address.country || "",
        phone: initialPhone,
        isDefault: Boolean(address.isDefault),
    });

    useEffect(() => {
        if (userInfo?.phone) {
            setForm((prev) => ({ ...prev, phone: userInfo.phone }));
        }
    }, [userInfo]);

    const [saving, setSaving] = useState(false);

    const handleTypeChange = (e) => {
        const val = e.target.value;
        setSelectedType(val);
        if (val !== "Other") {
            setForm((prev) => ({ ...prev, label: val }));
        } else {
            setForm((prev) => ({ ...prev, label: customLabel }));
        }
    };

    const handleCustomLabelChange = (e) => {
        const val = e.target.value;
        setCustomLabel(val);
        setForm((prev) => ({ ...prev, label: val }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const finalLabel = selectedType === "Other" ? customLabel : form.label;
        const payload = {
            ...form,
            label: finalLabel || "Home",
        };

        try {
            let res;
            if (isEdit) {
                res = await api.put(
                    `${serverUrl}/api/user/addresses/${address._id}`,
                    payload
                );
            } else {
                res = await api.post(`${serverUrl}/api/user/addresses`, payload);
            }

            if (res.data.success) {
                toast.success(
                    isEdit ? "Address updated successfully!" : "Address added successfully!"
                );
                if (onSuccess) {
                    onSuccess(res.data.address || res.data.addresses);
                }
            } else {
                toast.error(res.data.message || "Failed to save address");
            }
        } catch (error) {
            console.error("Error saving address:", error);
            if (error.response && error.response.data) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to save address");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                        {isEdit ? "Edit Address" : "Add New Address"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Address Label */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address Label *
                        </label>
                        <div className="relative">
                            <select
                                value={selectedType}
                                onChange={handleTypeChange}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                                required
                            >
                                <option value="">Select address type</option>
                                <option value="Home">Home</option>
                                <option value="Work">Work</option>
                                <option value="Hometown">Hometown</option>
                                <option value="Other">Other</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </div>
                        </div>
                        {selectedType === "Other" && (
                            <input
                                type="text"
                                value={customLabel}
                                onChange={handleCustomLabelChange}
                                placeholder="Enter custom label (e.g. Vacation Home)"
                                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                            />
                        )}
                    </div>

                    {/* Street Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address *
                        </label>
                        <input
                            type="text"
                            name="street"
                            value={form.street}
                            onChange={handleChange}
                            placeholder="House number and street name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            placeholder="Contact phone number"
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                        />
                    </div>

                    {/* City & State */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City *
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                State *
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={form.state}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    {/* ZIP Code & Country */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ZIP Code *
                            </label>
                            <input
                                type="text"
                                name="zipCode"
                                value={form.zipCode}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country *
                            </label>
                            <input
                                type="text"
                                name="country"
                                value={form.country}
                                onChange={handleChange}
                                placeholder="e.g. India"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    {/* Set as default checkbox */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isDefault"
                            name="isDefault"
                            checked={form.isDefault}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label
                            htmlFor="isDefault"
                            className="ml-2 text-sm text-gray-700 cursor-pointer"
                        >
                            Set as default address
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {saving
                                ? isEdit
                                    ? "Saving..."
                                    : "Adding..."
                                : isEdit
                                ? "Save Address"
                                : "Add Address"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default EditAddressModal;