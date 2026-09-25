import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Title from "../components/ui/title";
import Input, { Label } from "../components/ui/input";
import { serverUrl } from "../../config";
import { FaStar, FaSearch, FaTimes } from "react-icons/fa";
import api from "../api/axiosInstance";

const AddReview = ({ token }) => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [reviewerName, setReviewerName] = useState("");
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const dropdownRef = useRef(null);

    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const response = await api.get(`${serverUrl}/api/products`);

            const data = response.data;
            if (data.success) {
                setProducts(data.products);
            } else {
                toast.error(data.message || "Failed to fetch products");
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to load products");
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredProducts([]);
            return;
        }

        const filtered = products.filter((product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setSearchTerm(product.name);
        setShowDropdown(false);
    };

    const handleClearProduct = () => {
        setSelectedProduct(null);
        setSearchTerm("");
        setFilteredProducts([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedProduct) {
            toast.error("Please select a product");
            return;
        }

        if (!reviewerName.trim()) {
            toast.error("Please enter reviewer name");
            return;
        }

        if (rating === 0) {
            toast.error("Please select a star rating");
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                productId: selectedProduct._id,
                reviewerName: reviewerName.trim(),
                rating: rating,
                description: description.trim(),
            };

            const response = await api.post(
                `${serverUrl}/api/rating/admin/add`,
                payload,
            );

            const data = response.data;
            if (data.success) {
                toast.success(data.message);
                setSelectedProduct(null);
                setSearchTerm("");
                setReviewerName("");
                setRating(0);
                setDescription("");
            } else {
                toast.error(data.message || "Failed to add review");
            }
        } catch (error) {
            console.error("Error adding review-------->", error);
            toast.error(error?.response?.data?.message || "Failed to add review");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Review</h1>
                <p className="text-gray-600">
                    Manually create a review for any product
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Create New Review</h3>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Product Select Dropdown */}
                        <div className="flex flex-col">
                            <Label htmlFor="product">Select Product *</Label>
                            <select
                                id="product"
                                value={selectedProduct?._id || ""}
                                onChange={(e) => {
                                    const prod = products.find((p) => p._id === e.target.value);
                                    setSelectedProduct(prod || null);
                                }}
                                className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                required
                            >
                                <option value="">-- Select Product --</option>
                                {products.map((product) => (
                                    <option key={product._id} value={product._id}>
                                        {product.name} ({product.category} - ₹{product.price})
                                    </option>
                                ))}
                            </select>

                            {selectedProduct && (
                                <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    {selectedProduct.images && selectedProduct.images[0] ? (
                                        <img
                                            src={selectedProduct.images[0]}
                                            alt={selectedProduct.name}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                    ) : selectedProduct.image ? (
                                        <img
                                            src={selectedProduct.image}
                                            alt={selectedProduct.name}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                    ) : null}
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedProduct.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {selectedProduct.category} - ₹{selectedProduct.price}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reviewer Name */}
                        <div className="flex flex-col">
                            <Label htmlFor="reviewerName">Reviewer Name *</Label>
                            <Input
                                type="text"
                                id="reviewerName"
                                placeholder="Enter reviewer name"
                                value={reviewerName}
                                onChange={(e) => setReviewerName(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        {/* Star Rating */}
                        <div className="flex flex-col">
                            <Label>Rating *</Label>
                            <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <FaStar
                                            className={`w-8 h-8 ${
                                                star <= (hoverRating || rating)
                                                    ? "text-yellow-400"
                                                    : "text-gray-300"
                                            } transition-colors`}
                                        />
                                    </button>
                                ))}
                                {rating > 0 && (
                                    <span className="ml-2 text-sm text-gray-600">
                                        {rating} {rating === 1 ? "star" : "stars"}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col">
                            <Label htmlFor="description">Review Description</Label>
                            <textarea
                                id="description"
                                rows={4}
                                placeholder="Write the review text..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Adding Review..." : "Add Review"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddReview;
