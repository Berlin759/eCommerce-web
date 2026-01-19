import axios from "axios";
import { store } from "../redux/store";
import { logout } from "../redux/slices/authSlice";
import { serverUrl } from "../../config"

const api = axios.create({
    baseURL: serverUrl,
    headers: {
        "ngrok-skip-browser-warning": "true",
    },
    withCredentials: true,
});

// Attach token to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
});

// Logout if token expired or invalid
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const msg = error?.response?.data?.message;

        if (msg === "TOKEN_EXPIRED" || msg === "INVALID_TOKEN") {
            localStorage.removeItem("token");
            store.dispatch(logout());

            window.location.href = "/login"; // redirect immediately
        };

        return Promise.reject(error);
    },
);

export default api;