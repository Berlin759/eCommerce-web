// src/components/UploadPhotoModal.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api/axiosInstance";
import { serverUrl } from "../../config";

const UploadPhotoModal = ({ user, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(user?.avatar || null);
    const [loading, setLoading] = useState(false);

    const handleFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("avatar", file);

            const res = await api.post(`${serverUrl}/api/user/upload-avatar`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success) {
                // backend returns avatarUrl
                const avatarUrl = res.data.avatarUrl || res.data.avatar;
                onSuccess && onSuccess(avatarUrl);
                onClose();
            } else {
                throw new Error(res.data.message || "Upload failed");
            }
        } catch (err) {
            console.error(err);
            alert(err.message || "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-6 rounded-2xl w-full max-w-md"
            >
                <h3 className="text-lg font-semibold mb-4">Upload Avatar</h3>

                <div className="flex flex-col items-center gap-4">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {preview ? (
                            <img src={preview} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-gray-400">No preview</div>
                        )}
                    </div>

                    <input type="file" accept="image/*" onChange={handleFile} />

                    <div className="flex justify-end gap-3 w-full mt-4">
                        <button onClick={onClose} className="px-4 py-2 border rounded-lg">
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
                        >
                            {loading ? "Uploading..." : "Upload"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default UploadPhotoModal;