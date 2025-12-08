// src/components/ChangePasswordModal.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api/axiosInstance";
import { serverUrl } from "../../config";
import toast from "react-hot-toast";

const ChangePasswordModal = ({ onClose }) => {
    const [form, setForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState({ old: false, new: false, confirm: false });

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.oldPassword || !form.newPassword) {
            return toast.error("Fill both fields");
        }
        if (form.newPassword !== form.confirmPassword) {
            return toast.error("Passwords do not match");
        }
        setLoading(true);
        try {
            const res = await api.put(`${serverUrl}/api/user/change-password`, {
                oldPassword: form.oldPassword,
                newPassword: form.newPassword,
            });
            if (res.data.success) {
                toast.success(res.data.message || "Password changed");
                onClose();
            } else {
                throw new Error(res.data.message || "Change password failed");
            }
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Change password failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
                <h3 className="text-xl font-semibold mb-4">Change Password</h3>

                <div className="space-y-3">
                    <div>
                        <label className="text-sm text-gray-600">Old Password</label>
                        <div className="relative">
                            <input
                                name="oldPassword"
                                type={show.old ? "text" : "password"}
                                value={form.oldPassword}
                                onChange={handleChange}
                                className="w-full mt-1 p-3 border rounded-lg"
                            />
                            <button
                                onClick={() => setShow((s) => ({ ...s, old: !s.old }))}
                                className="absolute right-3 top-3 text-sm"
                                type="button"
                            >
                                {show.old ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">New Password</label>
                        <div className="relative">
                            <input
                                name="newPassword"
                                type={show.new ? "text" : "password"}
                                value={form.newPassword}
                                onChange={handleChange}
                                className="w-full mt-1 p-3 border rounded-lg"
                            />
                            <button
                                onClick={() => setShow((s) => ({ ...s, new: !s.new }))}
                                className="absolute right-3 top-3 text-sm"
                                type="button"
                            >
                                {show.new ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Confirm New Password</label>
                        <div className="relative">
                            <input
                                name="confirmPassword"
                                type={show.confirm ? "text" : "password"}
                                value={form.confirmPassword}
                                onChange={handleChange}
                                className="w-full mt-1 p-3 border rounded-lg"
                            />
                            <button
                                onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                                className="absolute right-3 top-3 text-sm"
                                type="button"
                            >
                                {show.confirm ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600">
                        Tip: use a mix of uppercase, lowercase, numbers & symbols.
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-60"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ChangePasswordModal;