// Stock management helper functions
import {
    FaClock,
    FaCheckCircle,
    FaTruck,
    FaBox,
    FaTimes,
} from "react-icons/fa";

/**
 * Process checkout and update product stock
 * @param {Array} cartItems - Array of {productId, quantity}
 * @param {string} serverUrl - Backend server URL
 * @returns {Promise} - Checkout response
 */
import api from "../api/axiosInstance";

export const processCheckout = async (cartItems, serverUrl) => {
    try {
        const response = await api.post(`${serverUrl}/checkout`, {
            items: cartItems,
        });

        const data = response.data;

        return data;
    } catch (error) {
        console.error("Checkout error:", error);
        throw error;
    };
};

/**
 * Update stock for a single product
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to reduce
 * @param {string} serverUrl - Backend server URL
 * @returns {Promise} - Stock update response
 */
export const updateProductStock = async (productId, quantity, serverUrl) => {
    try {
        const response = await api.post(`${serverUrl}/api/product/update-stock`, {
            productId: productId,
            quantity: quantity,
        });

        const data = response.data;

        return data;
    } catch (error) {
        console.error("Stock update error:", error);
        throw error;
    };
};

/**
 * Check if product has sufficient stock
 * @param {Object} product - Product object
 * @param {number} requestedQuantity - Requested quantity
 * @returns {boolean} - Whether stock is sufficient
 */
export const hasValidStock = (product, requestedQuantity) => {
    return product && product.stock >= requestedQuantity && product.isAvailable;
};

/**
 * Get stock status text
 * @param {Object} product - Product object
 * @returns {string} - Stock status text
 */
export const getStockStatus = (product) => {
    if (!product) return "Product not found";

    if (!product.isAvailable) return "Out of Stock";

    if (product.stock === 0) return "Out of Stock";

    if (product.stock <= 5) return `Only ${product.stock} left`;

    if (product.stock <= 10) return `${product.stock} in stock`;

    return "In Stock";
};

export const getOrderStatusColorAndIcon = (status) => {
    switch (status) {
        case "pending":
            return {
                color: "bg-yellow-100 text-yellow-800 border-yellow-200",
                icon: FaClock,
                iconColor: "text-yellow-600",
            };
        case "confirmed":
            return {
                color: "bg-blue-100 text-blue-800 border-blue-200",
                icon: FaCheckCircle,
                iconColor: "text-blue-600",
            };
        case "shipped":
            return {
                color: "bg-purple-100 text-purple-800 border-purple-200",
                icon: FaTruck,
                iconColor: "text-purple-600",
            };
        case "delivered":
            return {
                color: "bg-green-100 text-green-800 border-green-200",
                icon: FaBox,
                iconColor: "text-green-600",
            };
        case "cancelled":
            return {
                color: "bg-red-100 text-red-800 border-red-200",
                icon: FaTimes,
                iconColor: "text-red-600",
            };
        default:
            return {
                color: "bg-gray-100 text-gray-800 border-gray-200",
                icon: FaClock,
                iconColor: "text-gray-600",
            };
    };
};

export const getPaymentStatusColorAndIcon = (status) => {
    switch (status) {
        case "pending":
            return {
                color: "bg-yellow-100 text-yellow-800 border-yellow-200",
                icon: FaClock,
                iconColor: "text-yellow-600",
            };
        case "paid":
            return {
                color: "bg-green-100 text-green-800 border-green-200",
                icon: FaCheckCircle,
                iconColor: "text-green-600",
            };
        case "failed":
            return {
                color: "bg-red-100 text-red-800 border-red-200",
                icon: FaTimes,
                iconColor: "text-red-600",
            };
        default:
            return {
                color: "bg-gray-100 text-gray-800 border-gray-200",
                icon: FaClock,
                iconColor: "text-gray-600",
            };
    };
};

/**
 * Calculate discounted price
 * @param {number} price - Original price
 * @param {number} discountPercentage - Discount percentage (default 10)
 * @returns {number} - Discounted price
 */
export const calculateDiscountedPrice = (price, discountPercentage = 10) => {
    const discountAmount = (price * discountPercentage) / 100;
    const remainingAmount = price - discountAmount;

    return { discountAmount, remainingAmount };
};

/**
 * Calculate Percentage
 * @param {number} mrp - Original price
 * @param {number} price - discount price
 * @returns {number} - Discounted percentage
 */
export const calculateDiscountedPercentage = (firstPrice, secondPrice) => {
    if (firstPrice === 0) return 0;

    const discountPercentage = (secondPrice * 100) / firstPrice;
    return discountPercentage;
};
