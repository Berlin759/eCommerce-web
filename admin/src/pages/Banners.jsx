import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Container from "../components/Container";
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaImage,
    FaSearch,
    FaExternalLinkAlt,
    FaSync,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { serverUrl } from "../../config";
import api from "../api/axiosInstance";

const Banners = () => {
    const { token } = useSelector((state) => state.auth);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        description: "",
        discount: "",
        from: "",
        sale: "",
        image: null,
    });
    const [imagePreview, setImagePreview] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Fetch banners
    const fetchBanners = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`${serverUrl}/api/banner`);
            const data = response.data;

            if (data.success) {
                setBanners(data.banners);
            } else {
                toast.error(data.message || "Failed to fetch banners");
            }
        } catch (error) {
            console.error("Fetch banners error:", error);
            toast.error("Failed to fetch banners");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle image upload
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                image: file,
            }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        for (const [key, value] of Object.entries(formData)) {
            if (!value && key !== "image") {
                toast.error(`Please fill the ${key} field`);
                return;
            };
        };

        if (!formData.image && !editingBanner) {
            toast.error("Banner image is required");
            return;
        };

        setSubmitting(true);

        try {
            const formDataToSend = new FormData();

            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null) formDataToSend.append(key, value);
            });

            let response;
            if (editingBanner) {
                response = await api.put(`${serverUrl}/api/banner/${editingBanner._id}`,
                    formDataToSend,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    },
                );
            } else {
                response = await api.post(`${serverUrl}/api/banner`,
                    formDataToSend,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    },
                );
            };

            const result = response.data;

            if (result.success) {
                toast.success(
                    editingBanner
                        ? "Banner updated successfully"
                        : "Banner created successfully"
                );
                fetchBanners();
                closeModal();
            } else {
                toast.error(result.message || "Failed to save banner");
            }
        } catch (error) {
            console.error("Submit banner error:", error);
            toast.error("Failed to save banner");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete banner
    const handleDelete = async (bannerId) => {
        if (!window.confirm("Are you sure you want to delete this banner?")) {
            return;
        }

        try {
            const response = await api.delete(`${serverUrl}/api/banner/${bannerId}`);

            const data = response.data;

            if (data.success) {
                toast.success("Banner deleted successfully");
                fetchBanners();
            } else {
                toast.error(data.message || "Failed to delete banner");
            }
        } catch (error) {
            console.error("Delete banner error:", error);
            toast.error("Failed to delete banner");
        }
    };

    // Open modal for create/edit
    const openModal = (banner = null) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                subtitle: banner.subtitle,
                description: banner.description,
                discount: banner.discount,
                from: banner.from,
                sale: banner.sale,
                image: null,
            });
            setImagePreview(banner.image);
        } else {
            setEditingBanner(null);
            setFormData({
                title: "",
                subtitle: "",
                description: "",
                discount: "",
                from: "",
                sale: "",
                image: null,
            });
            setImagePreview("");
        }
        setShowModal(true);
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setEditingBanner(null);
        setFormData({
            title: "",
            subtitle: "",
            description: "",
            discount: "",
            from: "",
            sale: "",
            image: null,
        });
        setImagePreview("");
    };

    // Filter banners based on search
    const filteredBanners = banners.filter((banner) =>
        banner.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            Banners
                        </h1>
                        <p className="text-gray-600 mt-1">Manage product banners</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchBanners}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            title="Refresh Banners"
                        >
                            <FaSync className="w-4 h-4" />
                            Refresh
                        </button>
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <FaPlus />
                            Add Banner
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search banners..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <>
                        {/* Skeleton for table view on large screens */}
                        <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Image
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Banner Title
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Banner Sub Title
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Banner Description
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Banner Discount
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Banner From
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Banner Sale Type
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {[...Array(8)].map((_, index) => (
                                            <tr key={index} className="animate-pulse">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                                                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Skeleton for card view on small screens */}
                        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[...Array(6)].map((_, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse"
                                >
                                    <div className="w-full h-48 bg-gray-200"></div>
                                    <div className="p-4 space-y-3">
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="flex gap-2">
                                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : filteredBanners.length === 0 ? (
                    <div className="text-center py-12">
                        <FaImage className="mx-auto text-6xl text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            {searchTerm ? "No banners found" : "No banners yet"}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {searchTerm
                                ? "Try adjusting your search terms"
                                : "Start by creating your first banners"}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => openModal()}
                                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Create Banner
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Table view for large screens */}
                        <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Image
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Banner Title
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Banner Sub Title
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Banner Description
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Banner Discount
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Banner From
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Banner Sale Type
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredBanners.map((banner) => (
                                            <tr
                                                key={banner._id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <img
                                                        src={banner.image}
                                                        alt={banner.title}
                                                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {banner.title}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {banner.subtitle}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {banner.description}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {banner.discount}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {banner.from}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {banner.sale}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => openModal(banner)}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                                                        >
                                                            <FaEdit className="text-xs" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(banner._id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                                                        >
                                                            <FaTrash className="text-xs" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Card view for small screens */}
                        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {filteredBanners.map((banner) => (
                                <div
                                    key={banner._id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="relative">
                                        <img
                                            src={banner.image}
                                            alt={banner.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {banner.title}
                                        </h3>
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {banner.subtitle}
                                        </h3>
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {banner.description}
                                        </h3>
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {banner.discount}
                                        </h3>
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {banner.from}
                                        </h3>
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {banner.sale}
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal(banner)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                            >
                                                <FaEdit />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(banner._id)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                            >
                                                <FaTrash />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Modal */}
                {showModal && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                closeModal();
                            }
                        }}
                    >
                        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-semibold">
                                    {editingBanner ? "Edit Banner" : "Add Banner"}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <IoMdClose size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Banner Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="Enter banner title"
                                        required
                                    />
                                </div>
                                {/* Sub-Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Banner Sub-Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="subtitle"
                                        value={formData.subtitle}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="Enter banner sub-title"
                                        required
                                    />
                                </div>
                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Banner Description *
                                    </label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="Enter banner description"
                                        required
                                    />
                                </div>
                                {/* Discount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Banner discount *
                                    </label>
                                    <input
                                        type="text"
                                        name="discount"
                                        value={formData.discount}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="Enter discount Text"
                                        required
                                    />
                                    <span className="block text-sm font-small text-gray-500 mt-1">
                                        (Ex. "Up to 40% off", "₹250 off", "Free shipping")
                                    </span>
                                </div>
                                {/* from Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Banner from Amount *
                                    </label>
                                    <input
                                        type="text"
                                        name="from"
                                        value={formData.from}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="Enter banner from amount"
                                        required
                                    />
                                </div>
                                {/* Sale Text */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Banner Sale Type *
                                    </label>
                                    <input
                                        type="text"
                                        name="sale"
                                        value={formData.sale}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="Enter banner sale Type"
                                        required
                                    />
                                    <span className="block text-sm font-small text-gray-500 mt-1">
                                        (Ex. "Limited Time", "Special Offer", "Weekend Deal")
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Banner Image *
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                    {imagePreview && (
                                        <div className="mt-3">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-32 h-32 object-cover rounded-lg border"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? "Saving..." : editingBanner ? "Update" : "Create"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Container>
    );
};

export default Banners;
