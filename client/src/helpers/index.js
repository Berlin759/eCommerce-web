import api from "../api/axiosInstance";

export const getData = async (endpoint) => {
    try {
        const response = await api.get(endpoint);
        const data = response.data;

        return data;
    } catch (error) {
        console.error("Error fetching products:", error);
    }
};
