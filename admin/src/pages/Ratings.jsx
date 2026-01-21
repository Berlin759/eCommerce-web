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
    FaTimes,
    FaSort,
    FaSync,
    FaEnvelope,
    FaStar,
} from "react-icons/fa";
import api from "../api/axiosInstance";

const Ratings = () => {
    const [ratingList, setRatingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [sortBy, setSortBy] = useState("date");
    const [sortRating, setSortRating] = useState("desc");
    const [editingRating, setEditingRating] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newRating, setNewRating] = useState("");
    const [adminNotes, setAdminNotes] = useState("");

    const ratingOptions = [1, 2, 3, 4, 5];

    const fetchRating = async () => {
        try {
            setLoading(true);
            const response = await api.get(`${serverUrl}/api/rating/admin/list`);

            const result = response.data;
            if (result.success) {
                setRatingList(result.ratings);
            } else {
                toast.error(result.message || "Failed to fetch Rating");
            };
        } catch (error) {
            console.error("Error fetching Rating:", error);
            toast.error("Failed to load Rating");
        } finally {
            setLoading(false);
        };
    };

    const handleChange = (e) => {
        setAdminNotes(e.target.value);
    };

    const updateRating = async (ratingId, rating, adminNotes = null) => {
        try {
            const updateData = { ratingId, rating };

            if (adminNotes) {
                updateData.description = adminNotes;
            };

            const response = await api.put(`${serverUrl}/api/rating/update/${ratingId}`, updateData);

            const data = response.data;
            if (data.success) {
                setShowEditModal(false);
                setEditingRating(null);
                fetchRating();
                toast.success(data?.message);
            } else {
                toast.error(data.message || "Failed to update rating");
            }
        } catch (error) {
            console.error("Error updating rating--------->", error);
            toast.error("Failed to update rating");
        };
    };

    const deleteRating = async (ratingId) => {
        if (!window.confirm("Are you sure you want to delete this rating?")) {
            return;
        };

        try {
            const response = await api.post(`${serverUrl}/api/rating/remove`, {
                ratingId: ratingId,
            });

            const data = response.data;
            if (data.success) {
                toast.success("Rating deleted successfully");
                fetchRating();
            } else {
                toast.error(data.message || "Failed to delete rating");
            }
        } catch (error) {
            console.error("Error deleting rating:", error);
            toast.error("Failed to delete rating");
        }
    };

    const handleEditRating = (rating) => {
        setEditingRating(rating);
        setNewRating(rating.rating);
        setAdminNotes(rating.description);
        setShowEditModal(true);
    };

    // Handle save changes
    const handleSaveChanges = () => {
        if (editingRating) {
            updateRating(editingRating._id, newRating, adminNotes);
        }
    };

    const filteredRating = ratingList
        .filter((item) => {
            const matchesSearch =
                item._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRating = ratingFilter === "all" || item.rating.toString() === ratingFilter;

            return matchesSearch && matchesRating;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "new":
                    return new Date(b.createdAt) - new Date(a.createdAt); // newest first

                case "old":
                    return new Date(a.createdAt) - new Date(b.createdAt); // oldest first

                case "high":
                    return b.rating - a.rating; // highest rating first

                case "low":
                    return a.rating - b.rating; // lowest rating first

                default:
                    return new Date(b.createdAt) - new Date(a.createdAt); // newest first
            };
        });

    useEffect(() => {
        fetchRating();
    }, []);

    if (loading) {
        return (
            <div>
                <Title>Rating List</Title>
                <div className="mt-6">
                    <SkeletonLoader type="ratings" />
                </div>
            </div>
        );
    };

    return (
        <div className="mt-3">
            <div className="flex items-center justify-between mb-6">
                <Title>Ratings Management</Title>
                <button
                    onClick={fetchRating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    title="Refresh Rating"
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
                                Total Ratings
                            </p>
                            <p className="text-xl lg:text-2xl font-bold text-gray-900">
                                {ratingList.length}
                            </p>
                        </div>
                        <FaStar className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
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
                            placeholder="Search User Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Rating Filter */}
                    <select
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="all">All Rating</option>
                        {ratingOptions.map((rating) => (
                            <option key={rating} value={rating}>
                                {/* {rating} ⭐ */}
                                {rating} {"⭐".repeat(rating)}
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
                            <option value="new">Sort by New</option>
                            <option value="old">Sort by Old</option>
                            <option value="high">Sort by High</option>
                            <option value="low">Sort by Low</option>
                        </select>
                        {/* <button
                            onClick={() => setSortRating(sortRating === "asc" ? "desc" : "asc")}
                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title={`Sort ${sortRating === "asc" ? "Descending" : "Ascending"}`}
                        >
                            <FaSort className="w-4 h-4" />
                        </button> */}
                    </div>
                </div>
            </div>

            {/* Rating Table - Desktop */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rating ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rating
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRating.map((rating) => (
                                <tr key={rating._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            #{rating._id.slice(-8).toUpperCase()}
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
                                                    {rating.userId?.name || "N/A"}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {rating.userId?.email || "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <FaEnvelope className="w-4 h-4 mr-2 text-gray-400" />
                                            {rating.userId?.email || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            {rating.productId?.name || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                                            <span className="text-sm">{rating.rating || 5}</span> {"⭐".repeat(rating.rating || 5)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => handleEditRating(rating)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                title="Edit Rating"
                                            >
                                                <FaEdit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteRating(rating._id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                                title="Delete Rating"
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

                {filteredRating.length === 0 && (
                    <div className="text-center py-12">
                        <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Rating found
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm || ratingFilter !== "all"
                                ? "Try adjusting your filters"
                                : "No rating have been placed yet"}
                        </p>
                    </div>
                )}
            </div>

            {/* Rating Cards - Mobile/Tablet */}
            <div className="lg:hidden space-y-4">
                {filteredRating.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Rating found
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm || ratingFilter !== "all"
                                ? "Try adjusting your filters"
                                : "No rating have been placed yet"}
                        </p>
                    </div>
                ) : (
                    filteredRating.map((rating) => (
                        <div
                            key={rating._id}
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
                                            #{rating._id.slice(-8).toUpperCase()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {rating.userId?.name || "N/A"}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEditRating(rating)}
                                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                                        title="Edit Rating"
                                    >
                                        <FaEdit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteRating(rating._id)}
                                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                                        title="Delete Rating"
                                    >
                                        <FaTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-3">
                                <div className="text-sm text-gray-600 mb-1">Customer Email</div>
                                <div className="text-sm font-medium text-gray-900">
                                    {rating.userId?.email || "N/A"}
                                </div>
                            </div>

                            {/* Rating Details */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Product name</div>
                                    <div className="flex items-center text-sm text-gray-900">
                                        {rating.productId?.name || "N/A"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Rating</div>
                                    <div className="text-sm text-gray-900">
                                        {rating.rating || 5} {"⭐".repeat(rating.rating || 5)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && editingRating && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
                    <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Edit Rating
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingRating(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <div className="text-sm text-gray-600 mb-2">
                                    Rating #{editingRating._id.slice(-8).toUpperCase()}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rating Reviews
                                </label>
                                <select
                                    value={newRating}
                                    onChange={(e) => setNewRating(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    {ratingOptions.map((rating) => (
                                        <option key={rating} value={rating}>
                                            {rating} {"⭐".repeat(rating)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="message"
                                    value={adminNotes}
                                    onChange={handleChange}
                                    placeholder="Write description..."
                                    className="w-full border p-3 rounded-md bg-white outline-none h-32"
                                ></textarea>
                            </div>

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
                                        setEditingRating(null);
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

export default Ratings;