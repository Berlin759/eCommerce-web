import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Title from "../components/ui/title";
import SkeletonLoader from "../components/SkeletonLoader";
import { serverUrl } from "../../config";
import {
    FaEdit,
    FaTrash,
    FaSearch,
    FaUser,
    FaShoppingBag,
    FaCreditCard,
    FaClock,
    FaCheckCircle,
    FaBox,
    FaTimes,
    FaSort,
    FaSync,
    FaEnvelope,
} from "react-icons/fa";
import api from "../api/axiosInstance";

const Contacts = () => {
    const [contactUs, setContactUs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("date");
    const [sortContactUs, setSortContactUs] = useState("desc");
    const [editingContactUs, setEditingContactUs] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [adminNotes, setAdminNotes] = useState("");

    const statusOptions = [
        "unread",
        "read",
        "replied",
    ];

    const fetchContactUs = async () => {
        try {
            setLoading(true);
            const response = await api.get(`${serverUrl}/api/contact/admin/all`);

            const result = response.data;
            if (result.success) {
                setContactUs(result.data);
            } else {
                toast.error(result.message || "Failed to fetch contactUs");
            };
        } catch (error) {
            console.error("Error fetching contactUs:", error);
            toast.error("Failed to load contactUs");
        } finally {
            setLoading(false);
        };
    };

    const handleChange = (e) => {
        setAdminNotes(e.target.value);
    };

    const updateContactUsStatus = async (contactUsId, status, adminNotes = null) => {
        try {
            const updateData = { contactUsId, status };

            if (adminNotes) {
                updateData.adminNotes = adminNotes;
            };

            const response = await api.put(`${serverUrl}/api/contact/admin/update-status`, updateData);

            const data = response.data;
            if (data.success) {
                setShowEditModal(false);
                setEditingContactUs(null);
                fetchContactUs();
                toast.success(data?.message);
            } else {
                toast.error(data.message || "Failed to update contactUs");
            }
        } catch (error) {
            console.error("Error updating contactUs--------->", error);
            toast.error("Failed to update contactUs");
        };
    };

    const deleteContactUs = async (contactUsId) => {
        if (!window.confirm("Are you sure you want to delete this contactUs?")) {
            return;
        };

        try {
            const response = await api.post(`${serverUrl}/api/contact/delete`, {
                contactUsId: contactUsId,
            });

            const data = response.data;
            if (data.success) {
                toast.success("ContactUs deleted successfully");
                fetchContactUs();
            } else {
                toast.error(data.message || "Failed to delete contactUs");
            }
        } catch (error) {
            console.error("Error deleting contactUs:", error);
            toast.error("Failed to delete contactUs");
        }
    };

    const handleEditContactUs = (contactUs) => {
        setEditingContactUs(contactUs);
        setNewStatus(contactUs.status);
        setShowEditModal(true);
    };

    // Handle save changes
    const handleSaveChanges = () => {
        if (editingContactUs) {
            updateContactUsStatus(editingContactUs._id, newStatus, adminNotes);
        }
    };

    const filteredContactUs = contactUs
        .filter((contact) => {
            const matchesSearch =
                contact._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contact.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contact.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || contact.status === statusFilter;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case "date":
                    aValue = new Date(a.date);
                    bValue = new Date(b.date);
                    break;
                case "status":
                    aValue = a.status;
                    bValue = b.status;
                    break;
                default:
                    aValue = a.date;
                    bValue = b.date;
            };

            if (sortContactUs === "asc") {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case "unread":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "read":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "replied":
                return "bg-green-100 text-green-800 border-green-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        };
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case "unread":
                return <FaClock className="w-3 h-3" />;
            case "read":
                return <FaCheckCircle className="w-3 h-3" />;
            case "replied":
                return <FaBox className="w-3 h-3" />;
            default:
                return <FaClock className="w-3 h-3" />;
        };
    };

    useEffect(() => {
        fetchContactUs();
    }, []);

    if (loading) {
        return (
            <div>
                <Title>ContactUs List</Title>
                <div className="mt-6">
                    <SkeletonLoader type="contacts" />
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <Title>ContactUs Management</Title>
                <button
                    onClick={fetchContactUs}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    title="Refresh ContactUs"
                >
                    <FaSync className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-600">
                                Total ContactUs
                            </p>
                            <p className="text-xl lg:text-2xl font-bold text-gray-900">
                                {contactUs.length}
                            </p>
                        </div>
                        <FaShoppingBag className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-600">
                                UnRead
                            </p>
                            <p className="text-xl lg:text-2xl font-bold text-yellow-600">
                                {contactUs.filter((o) => o.status === "unread").length}
                            </p>
                        </div>
                        <FaClock className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-600">
                                Read
                            </p>
                            <p className="text-xl lg:text-2xl font-bold text-green-600">
                                {contactUs.filter((o) => o.status === "read").length}
                            </p>
                        </div>
                        <FaBox className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-600">
                                replied
                            </p>
                            <p className="text-xl lg:text-2xl font-bold text-purple-600">
                                {contactUs.filter((o) => o.status === "replied").length}
                            </p>
                        </div>
                        <FaCreditCard className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative sm:col-span-2 lg:col-span-1">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search contactUs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="all">All Status</option>
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                        ))}
                    </select>

                    {/* Sort */}
                    <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="status">Sort by Status</option>
                        </select>
                        <button
                            onClick={() => setSortContactUs(sortContactUs === "asc" ? "desc" : "asc")}
                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title={`Sort ${sortContactUs === "asc" ? "Descending" : "Ascending"}`}
                        >
                            <FaSort className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ContactUs Table - Desktop */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ContactUs ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Message
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredContactUs.map((contactUs) => (
                                <tr key={contactUs._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            #{contactUs._id.slice(-8).toUpperCase()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8">
                                                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <FaUser className="w-4 h-4 text-gray-600" />
                                                </div>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {contactUs.userId?.name || "N/A"}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {contactUs.userId?.email || "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <FaEnvelope className="w-4 h-4 mr-2 text-gray-400" />
                                            {contactUs.email || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            {contactUs.subject || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {contactUs.message || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                contactUs.status
                                            )}`}
                                        >
                                            {getStatusIcon(contactUs.status)}
                                            {contactUs.status.charAt(0).toUpperCase() + contactUs.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            {
                                                contactUs.status !== "replied" && (
                                                    <button
                                                        onClick={() => handleEditContactUs(contactUs)}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                        title="Edit ContactUs"
                                                    >
                                                        <FaEdit className="w-4 h-4" />
                                                    </button>
                                                )
                                            }
                                            <button
                                                onClick={() => deleteContactUs(contactUs._id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                                title="Delete ContactUs"
                                            >
                                                <FaTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredContactUs.length === 0 && (
                    <div className="text-center py-12">
                        <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No ContactUs found
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm || statusFilter !== "all"
                                ? "Try adjusting your filters"
                                : "No contactUs have been placed yet"}
                        </p>
                    </div>
                )}
            </div>

            {/* ContactUs Cards - Mobile/Tablet */}
            <div className="lg:hidden space-y-4">
                {filteredContactUs.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No ContactUs found
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm || statusFilter !== "all"
                                ? "Try adjusting your filters"
                                : "No contactUs have been placed yet"}
                        </p>
                    </div>
                ) : (
                    filteredContactUs.map((contactUs) => (
                        <div
                            key={contactUs._id}
                            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                        <FaUser className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            #{contactUs._id.slice(-8).toUpperCase()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {contactUs.userId?.name || "N/A"}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEditContactUs(contactUs)}
                                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                                        title="Edit ContactUs"
                                    >
                                        <FaEdit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteContactUs(contactUs._id)}
                                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                                        title="Delete ContactUs"
                                    >
                                        <FaTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-3">
                                <div className="text-sm text-gray-600 mb-1">Customer Email</div>
                                <div className="text-sm font-medium text-gray-900">
                                    {contactUs.userId?.email || "N/A"}
                                </div>
                            </div>

                            {/* ContactUs Details */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Subject</div>
                                    <div className="flex items-center text-sm text-gray-900">
                                        {contactUs.subject || "N/A"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Message</div>
                                    <div className="text-sm text-gray-900">
                                        {contactUs.message}
                                    </div>
                                </div>
                            </div>

                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                        contactUs.status
                                    )}`}
                                >
                                    {getStatusIcon(contactUs.status)}
                                    {contactUs.status.charAt(0).toUpperCase() + contactUs.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && editingContactUs && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
                    <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Edit ContactUs
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingContactUs(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <div className="text-sm text-gray-600 mb-2">
                                    ContactUs #{editingContactUs._id.slice(-8).toUpperCase()}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ContactUs Status
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {
                                newStatus === "replied" && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes
                                        </label>
                                        <textarea
                                            name="message"
                                            value={adminNotes}
                                            onChange={handleChange}
                                            placeholder="Write your notes..."
                                            className="w-full border p-3 rounded-md bg-white outline-none h-32"
                                        ></textarea>
                                    </div>
                                )
                            }

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleSaveChanges}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingContactUs(null);
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contacts;