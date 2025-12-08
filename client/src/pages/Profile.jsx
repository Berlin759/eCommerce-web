// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { serverUrl } from "../../config";
import api from "../api/axiosInstance";
import { addUser, removeUser, resetOrderCount } from "../redux/orebiSlice";
import Container from "../components/Container";
import {
    FaSignOutAlt,
    FaUserCircle,
    FaCog,
    FaHeart,
    FaEdit,
    FaMapMarkerAlt,
    FaShieldAlt,
    FaCamera,
} from "react-icons/fa";
import EditProfileModal from "../components/EditProfileModal";
import UploadPhotoModal from "../components/UploadPhotoModal";
import EditAddressModal from "../components/EditAddressModal";
import ChangePasswordModal from "../components/ChangePasswordModal";

const tabs = [
    { id: "profile", label: "Profile Info", icon: <FaUserCircle /> },
    { id: "address", label: "Address", icon: <FaMapMarkerAlt /> },
    { id: "security", label: "Security", icon: <FaShieldAlt /> },
];

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const userInfo = useSelector((state) => state.orebiReducer.userInfo);

    const [loading, setLoading] = useState(true);
    const [openEdit, setOpenEdit] = useState(false);
    const [openUpload, setOpenUpload] = useState(false);
    const [openAddressEdit, setOpenAddressEdit] = useState(null); // address object or null
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

    // fetch latest profile
    useEffect(() => {
        if (!userInfo) {
            navigate("/signin");
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const response = await api.get(`${serverUrl}/api/user/profile`);
                if (response.data.success) {
                    dispatch(addUser(response.data.user));
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                toast.error("Unable to fetch profile");
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userInfo, navigate, dispatch]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        dispatch(removeUser());
        dispatch(resetOrderCount());
        toast.success("Logged out successfully");
        window.location.href = "/";
    };

    if (!userInfo || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600 text-lg">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12">
            <Container>
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column: avatar + simple info + tabs */}
                    <motion.aside
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-sm p-6 col-span-1"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="relative">
                                {userInfo.avatar ? (
                                    <img
                                        src={userInfo.avatar}
                                        alt="avatar"
                                        className="w-28 h-28 rounded-full object-cover shadow-md"
                                    />
                                ) : (
                                    <div className="w-28 h-28 bg-gray-900 rounded-full flex items-center justify-center shadow-md">
                                        <FaUserCircle className="text-4xl text-white" />
                                    </div>
                                )}
                                <button
                                    onClick={() => setOpenUpload(true)}
                                    title="Change avatar"
                                    className="absolute -bottom-1 -right-1 bg-white border p-2 rounded-full shadow hover:scale-105 transition"
                                >
                                    <FaCamera />
                                </button>
                            </div>

                            <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                                {userInfo.name}
                            </h2>
                            <p className="text-sm text-gray-600">{userInfo.email}</p>
                            <p className="text-sm text-gray-600 mt-1">
                                Phone: {userInfo.phone || "Not added"}
                            </p>

                            <div className="mt-4 w-full">
                                <button
                                    onClick={() => setOpenEdit(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <FaEdit />
                                    Edit Profile
                                </button>
                            </div>

                            <div className="mt-6 w-full">
                                <div className="border rounded-lg overflow-hidden">
                                    {tabs.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setActiveTab(t.id)}
                                            className={`w-full text-left px-4 py-3 flex items-center gap-3 ${
                                                activeTab === t.id
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "hover:bg-gray-50 text-gray-700"
                                            }`}
                                        >
                                            <span className="w-5">{t.icon}</span>
                                            <span className="flex-1">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 w-full">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                    <FaSignOutAlt />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </motion.aside>

                    {/* Right column: tab content */}
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="col-span-2"
                    >
                        {/* Profile Info Tab */}
                        {activeTab === "profile" && (
                            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                                <h3 className="text-xl font-semibold mb-4">
                                    Profile Info
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-600">
                                            Full name
                                        </label>
                                        <div className="mt-1 text-gray-800">
                                            {userInfo.name}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600">
                                            Email
                                        </label>
                                        <div className="mt-1 text-gray-800">
                                            {userInfo.email}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600">
                                            Phone
                                        </label>
                                        <div className="mt-1 text-gray-800">
                                            {userInfo.phone || "Not added"}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600">
                                            Member since
                                        </label>
                                        <div className="mt-1 text-gray-800">
                                            {new Date(userInfo.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Address Tab */}
                        {activeTab === "address" && (
                            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                                <h3 className="text-xl font-semibold mb-4">
                                    Addresses
                                </h3>

                                <div className="space-y-4">
                                    {userInfo.addresses && userInfo.addresses.length > 0 ? (
                                        userInfo.addresses.map((addr) => (
                                            <div
                                                key={addr._id}
                                                className="border rounded-lg p-4 flex items-start justify-between"
                                            >
                                                <div>
                                                    <div className="font-medium text-gray-800">
                                                        {addr.label || "Address"}
                                                        {addr.isDefault && (
                                                            <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-gray-600 text-sm mt-1">
                                                        {addr.street}, {addr.city}, {addr.state}{" "}
                                                        {addr.zipCode}
                                                    </div>
                                                    <div className="text-gray-600 text-sm mt-1">
                                                        {addr.country} • {addr.phone || "—"}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => setOpenAddressEdit(addr)}
                                                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-600">No addresses found.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === "security" && (
                            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                                <h3 className="text-xl font-semibold mb-4">Security</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">Change password</div>
                                            <div className="text-sm text-gray-600">
                                                Update your account password periodically.
                                            </div>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => setOpenChangePassword(true)}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                            >
                                                Change Password
                                            </button>
                                        </div>
                                    </div>

                                    {/* Optionally other security items */}
                                    {/* <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">Two-factor auth</div>
                                            <div className="text-sm text-gray-600">
                                                (Not implemented) Consider enabling 2FA for additional security.
                                            </div>
                                        </div>
                                        <div>
                                            <button className="px-4 py-2 border rounded">
                                                Manage
                                            </button>
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                        )}
                    </motion.section>
                </div>
            </Container>

            {/* Modals */}
            {openEdit && (
                <EditProfileModal user={userInfo} onClose={() => setOpenEdit(false)} />
            )}

            {openUpload && (
                <UploadPhotoModal
                    user={userInfo}
                    onClose={() => setOpenUpload(false)}
                    onSuccess={(avatarUrl) => {
                        // update redux quickly so UI reflects new avatar
                        dispatch(addUser({ ...userInfo, avatar: avatarUrl }));
                        toast.success("Avatar updated");
                    }}
                />
            )}

            {openAddressEdit && (
                <EditAddressModal
                    address={openAddressEdit}
                    onClose={() => setOpenAddressEdit(null)}
                    onSuccess={(updatedAddress) => {
                        // update addresses locally in redux
                        const updated = {
                            ...userInfo,
                            addresses: userInfo.addresses.map((a) =>
                                a._id === updatedAddress._id ? updatedAddress : a
                            ),
                        };
                        dispatch(addUser(updated));
                        toast.success("Address updated");
                        setOpenAddressEdit(null);
                    }}
                />
            )}

            {openChangePassword && (
                <ChangePasswordModal onClose={() => setOpenChangePassword(false)} />
            )}
        </div>
    );
};

export default Profile;