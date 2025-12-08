// src/components/EditAddressModal.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api/axiosInstance";
import { serverUrl } from "../../config";

const EditAddressModal = ({ address, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        label: address.label || "",
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        zipCode: address.zipCode || "",
        country: address.country || "",
        phone: address.phone || "",
        isDefault: !!address.isDefault,
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put(
                `${serverUrl}/api/user/addresses/${address._id}`,
                form
            );
            if (res.data.success) {
                onSuccess && onSuccess(res.data.address);
            } else {
                throw new Error(res.data.message || "Update failed");
            }
        } catch (err) {
            console.error(err);
            alert(err.message || "Address update failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-2xl p-6 w-full max-w-xl"
            >
                <h3 className="text-xl font-semibold mb-4">Edit Address</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                        name="label"
                        placeholder="Label (Home, Work)"
                        value={form.label}
                        onChange={handleChange}
                        className="p-3 border rounded-lg"
                    />
                    <input
                        name="phone"
                        placeholder="Phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="p-3 border rounded-lg"
                    />
                    <input
                        name="street"
                        placeholder="Street / Address"
                        value={form.street}
                        onChange={handleChange}
                        className="col-span-1 md:col-span-2 p-3 border rounded-lg"
                    />
                    <input
                        name="city"
                        placeholder="City"
                        value={form.city}
                        onChange={handleChange}
                        className="p-3 border rounded-lg"
                    />
                    <input
                        name="state"
                        placeholder="State"
                        value={form.state}
                        onChange={handleChange}
                        className="p-3 border rounded-lg"
                    />
                    <input
                        name="zipCode"
                        placeholder="ZIP / Pincode"
                        value={form.zipCode}
                        onChange={handleChange}
                        className="p-3 border rounded-lg"
                    />
                    <input
                        name="country"
                        placeholder="Country"
                        value={form.country}
                        onChange={handleChange}
                        className="p-3 border rounded-lg"
                    />

                    <label className="flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            name="isDefault"
                            checked={form.isDefault}
                            onChange={handleChange}
                        />
                        <span className="text-sm">Set as default address</span>
                    </label>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save Address"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default EditAddressModal;