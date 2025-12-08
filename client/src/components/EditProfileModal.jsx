// src/components/EditProfileModal.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api/axiosInstance";
import { serverUrl } from "../../config";
import { useDispatch } from "react-redux";
import { addUser } from "../redux/orebiSlice";
import toast from "react-hot-toast";

const EditProfileModal = ({ user, onClose }) => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSave = async () => {
        setSaving(true);
        try {
            // update general profile; endpoint in your earlier code used PUT /api/user/profile
            const res = await api.put(`${serverUrl}/api/user/profile`, formData);
            if (res.data.success) {
                // server may return updated user or not; prefer returned user
                const updatedUser = res.data.user ? res.data.user : { ...user, ...formData };
                dispatch(addUser(updatedUser));
                toast.success("Profile updated");
                onClose();
            } else {
                throw new Error(res.data.message || "Update failed");
            }
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-2xl p-6 w-full max-w-lg"
            >
                <h3 className="text-xl font-semibold mb-4">Edit Profile</h3>

                <div className="space-y-3">
                    <div>
                        <label className="text-sm text-gray-600">Full name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full mt-1 p-3 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full mt-1 p-3 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Phone</label>
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full mt-1 p-3 border rounded-lg"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default EditProfileModal;