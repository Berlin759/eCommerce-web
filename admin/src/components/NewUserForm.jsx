import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import toast from "react-hot-toast";
import Input, { Label } from "./ui/input";
import axios from "axios";
import { serverUrl } from "../../config";
import { MdClose, MdLocationOn, MdPhone, MdEmail, MdPerson, MdShield } from "react-icons/md";
import PropTypes from "prop-types";
import AddressModal from "./AddressModal";

const COUNTRY_CODES = [
    { code: "+91", country: "India (+91)", maxDigits: 10 },
    { code: "+1", country: "USA/Canada (+1)", maxDigits: 10 },
    { code: "+44", country: "UK (+44)", maxDigits: 10 },
    { code: "+61", country: "Australia (+61)", maxDigits: 9 },
    { code: "+971", country: "UAE (+971)", maxDigits: 9 },
    { code: "+65", country: "Singapore (+65)", maxDigits: 8 },
];

const NewUserForm = ({
    isOpen,
    setIsOpen,
    close,
    selectedUser,
    getUsersList,
    token,
    isReadOnly = false,
}) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        countryCode: "+91",
        role: "user",
        isActive: true,
        avatar: "",
    });

    const [phoneError, setPhoneError] = useState("");
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [userAddresses, setUserAddresses] = useState([]);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");

    const fetchUserAddresses = useCallback(
        async (userId) => {
            try {
                const response = await axios.get(
                    `${serverUrl}/api/user/${userId}/addresses`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (response.data.success) {
                    setUserAddresses(response.data.addresses || []);
                }
            } catch (error) {
                console.error("Fetch addresses error", error);
            }
        },
        [token]
    );

    useEffect(() => {
        setPhoneError("");
        if (selectedUser) {
            setFormData({
                _id: selectedUser?._id || null,
                name: selectedUser.name || "",
                email: selectedUser.email || "", // if user has never entered email, render empty string
                phone: selectedUser.phone || "",
                countryCode: selectedUser.countryCode || "+91",
                role: selectedUser.role || "user",
                isActive:
                    selectedUser.isActive !== undefined ? selectedUser.isActive : true,
                avatar: selectedUser.avatar || "",
            });

            setAvatarPreview(selectedUser.avatar || "");

            if (selectedUser._id) {
                fetchUserAddresses(selectedUser._id);
            }
        } else {
            setFormData({
                name: "",
                email: "",
                phone: "",
                countryCode: "+91",
                role: "user",
                isActive: true,
                avatar: "",
            });
            setUserAddresses([]);
            setAvatarPreview("");
            setAvatarFile(null);
        }
    }, [selectedUser, fetchUserAddresses]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
            }

            if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file");
                return;
            }

            setAvatarFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadAvatar = async () => {
        if (!avatarFile) return null;

        const formData = new FormData();
        formData.append("avatar", avatarFile);

        try {
            const response = await axios.post(
                `${serverUrl}/api/user/admin/upload-avatar`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                return response.data.avatarUrl;
            } else {
                toast.error(response.data.message);
                return null;
            }
        } catch (error) {
            console.error("Avatar upload error", error);
            toast.error("Failed to upload avatar");
            return null;
        }
    };

    const handlePhoneChange = (e) => {
        // Enforce NUMERIC digits only
        const val = e.target.value.replace(/[^0-9]/g, "");
        const currentCountry = COUNTRY_CODES.find((c) => c.code === formData.countryCode) || COUNTRY_CODES[0];
        const maxLen = currentCountry.maxDigits;

        if (val.length > maxLen) {
            return;
        }

        setFormData((prev) => ({ ...prev, phone: val }));

        if (formData.countryCode === "+91" && val.length > 0 && val.length < 10) {
            setPhoneError("Indian mobile numbers must be exactly 10 digits.");
        } else {
            setPhoneError("");
        }
    };

    const handleCountryCodeChange = (e) => {
        const newCode = e.target.value;
        const currentCountry = COUNTRY_CODES.find((c) => c.code === newCode) || COUNTRY_CODES[0];
        let newPhone = formData.phone;

        if (newPhone.length > currentCountry.maxDigits) {
            newPhone = newPhone.slice(0, currentCountry.maxDigits);
        }

        setFormData((prev) => ({ ...prev, countryCode: newCode, phone: newPhone }));

        if (newCode === "+91" && newPhone.length > 0 && newPhone.length < 10) {
            setPhoneError("Indian mobile numbers must be exactly 10 digits.");
        } else {
            setPhoneError("");
        }
    };

    const handleAddOrUpdateUser = async (e) => {
        e.preventDefault();

        if (isReadOnly) {
            toast.error("Cannot edit user - Read only mode");
            return;
        }

        // Validate phone number if provided or India code
        if (formData.countryCode === "+91" && formData.phone && formData.phone.length !== 10) {
            setPhoneError("Indian mobile numbers must be exactly 10 digits.");
            toast.error("Please enter a valid 10-digit mobile number for India.");
            return;
        }

        try {
            let avatarUrl = formData.avatar;

            if (avatarFile) {
                const uploadedUrl = await uploadAvatar();
                if (uploadedUrl) {
                    avatarUrl = uploadedUrl;
                }
            }

            let response;
            const userData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                countryCode: formData.countryCode,
                role: formData.role,
                isActive: formData.isActive,
                avatar: avatarUrl,
            };

            if (selectedUser) {
                response = await axios.put(
                    `${serverUrl}/api/user/update/${selectedUser._id}`,
                    userData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );
            } else {
                response = await axios.post(
                    `${serverUrl}/api/user/register`,
                    userData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );
            }

            const data = await response?.data;

            if (data?.success) {
                toast.success(data?.message);
                setIsOpen(false);
                getUsersList();
            } else {
                toast.error(data?.message);
            }
        } catch (error) {
            console.error("User save error", error);
            toast.error(error?.response?.data?.message || "An error occurred");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    return (
        <Dialog
            open={isOpen}
            as="div"
            className="relative z-[9999] focus:outline-none"
            onClose={close}
        >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

            <div className="fixed inset-0 z-[10000] w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
                    <DialogPanel
                        transition
                        className="w-full max-w-2xl rounded-2xl p-6 bg-white shadow-2xl border border-gray-100 text-gray-900 
                        max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                            <DialogTitle as="h3" className="text-xl font-bold flex items-center gap-2 text-gray-900">
                                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <MdPerson className="text-xl" />
                                </span>
                                {isReadOnly
                                    ? "User Profile Details"
                                    : selectedUser
                                        ? "Edit User Account"
                                        : "Add New User Account"}
                            </DialogTitle>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                                aria-label="Close modal"
                            >
                                <MdClose className="text-xl" />
                            </button>
                        </div>

                        {isReadOnly && (
                            <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                                <MdShield className="text-blue-600 text-lg flex-shrink-0" />
                                <p className="text-xs sm:text-sm text-blue-800 font-medium">
                                    Read-only view. Only administrators can modify user data.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleAddOrUpdateUser} className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="relative flex-shrink-0">
                                    {avatarPreview || formData.avatar ? (
                                        <img
                                            src={avatarPreview || formData.avatar}
                                            alt="Avatar preview"
                                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm">
                                            {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                                        </div>
                                    )}
                                </div>
                                {!isReadOnly && (
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            id="avatarInput"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="avatarInput"
                                            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer text-xs font-semibold text-gray-700 transition"
                                        >
                                            {avatarFile ? "Change Avatar Image" : "Upload Profile Avatar"}
                                        </label>
                                        <p className="text-[11px] text-gray-500 mt-1">PNG or JPG max 5MB</p>
                                    </div>
                                )}
                            </div>

                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                                    Account Information
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Full Name *</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            name="name"
                                            placeholder="John Doe"
                                            onChange={handleChange}
                                            value={formData.name}
                                            required
                                            disabled={isReadOnly}
                                            className={isReadOnly ? "bg-gray-50" : ""}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            placeholder="user@example.com"
                                            onChange={handleChange}
                                            value={formData.email}
                                            disabled={isReadOnly}
                                            className={isReadOnly ? "bg-gray-50" : ""}
                                        />
                                    </div>
                                </div>

                                {/* Mobile Number with Country Code */}
                                <div>
                                    <Label htmlFor="phone">Mobile Number</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <select
                                            value={formData.countryCode}
                                            onChange={handleCountryCodeChange}
                                            disabled={isReadOnly}
                                            className={`px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-black focus:border-transparent font-medium ${
                                                isReadOnly ? "opacity-75" : ""
                                            }`}
                                        >
                                            {COUNTRY_CODES.map((c) => (
                                                <option key={c.code} value={c.code}>
                                                    {c.country}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="relative flex-1">
                                            <input
                                                id="phone"
                                                type="text"
                                                inputMode="numeric"
                                                placeholder={
                                                    formData.countryCode === "+91"
                                                        ? "10 digit mobile number"
                                                        : "Mobile number"
                                                }
                                                value={formData.phone}
                                                onChange={handlePhoneChange}
                                                disabled={isReadOnly}
                                                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-all ${
                                                    phoneError
                                                        ? "border-red-500 focus:ring-2 focus:ring-red-200"
                                                        : "border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent"
                                                } ${isReadOnly ? "bg-gray-50" : ""}`}
                                            />
                                        </div>
                                    </div>
                                    {phoneError && (
                                        <p className="text-xs text-red-600 mt-1 font-medium">{phoneError}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="role">User Role</Label>
                                        <select
                                            id="role"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            disabled={isReadOnly}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent ${
                                                isReadOnly ? "bg-gray-50" : ""
                                            }`}
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="isActive">Account Status</Label>
                                        <select
                                            id="isActive"
                                            name="isActive"
                                            value={formData.isActive}
                                            onChange={(e) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    isActive: e.target.value === "true",
                                                }));
                                            }}
                                            disabled={isReadOnly}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent ${
                                                isReadOnly ? "bg-gray-50" : ""
                                            }`}
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Address Summary for Existing Users */}
                            {selectedUser && (
                                <div className="space-y-3 pt-3 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                            <MdLocationOn className="text-green-600 text-sm" />
                                            Saved Addresses ({userAddresses.length})
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddressModalOpen(true)}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                            disabled={isReadOnly}
                                        >
                                            Manage Addresses
                                        </button>
                                    </div>
                                    {userAddresses.length > 0 ? (
                                        <div className="space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            {userAddresses.slice(0, 2).map((addr, idx) => (
                                                <div key={addr._id || idx} className="text-xs flex items-center justify-between text-gray-700">
                                                    <span className="font-medium">{addr.label}: {addr.street}, {addr.city}</span>
                                                    {addr.isDefault && (
                                                        <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 italic">No saved addresses for this user.</p>
                                    )}
                                </div>
                            )}

                            {/* Modal Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    {isReadOnly ? "Close" : "Cancel"}
                                </button>
                                {!isReadOnly && (
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition shadow-sm"
                                    >
                                        {selectedUser ? "Save Changes" : "Create User"}
                                    </button>
                                )}
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </div>

            <AddressModal
                isOpen={isAddressModalOpen}
                close={() => setIsAddressModalOpen(false)}
                userId={selectedUser?._id}
                token={token}
                onAddressesChange={() => {
                    if (selectedUser?._id) {
                        fetchUserAddresses(selectedUser._id);
                    }
                    getUsersList();
                }}
            />
        </Dialog>
    );
};

NewUserForm.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    close: PropTypes.func.isRequired,
    selectedUser: PropTypes.object,
    getUsersList: PropTypes.func.isRequired,
    token: PropTypes.string.isRequired,
    isReadOnly: PropTypes.bool,
};

export default NewUserForm;
