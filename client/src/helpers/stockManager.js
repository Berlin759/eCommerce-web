// Stock management helper functions

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
            body: JSON.stringify({
                items: cartItems,
            }),
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
            body: JSON.stringify({
                productId,
                quantity,
            }),
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

/**
 * Calculate discounted price
 * @param {number} price - Original price
 * @param {number} discountPercentage - Discount percentage (default 10)
 * @returns {number} - Discounted price
 */
export const calculateDiscountedPrice = (price, discountPercentage = 10) => {
    const discountAmount = (price * discountPercentage) / 100;
    return price - discountAmount;
};
