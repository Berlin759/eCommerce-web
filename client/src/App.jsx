import { useEffect, useState, useCallback } from "react";
import Banner from "./components/Banner";
import Container from "./components/Container";
import BestSellers from "./components/homeProducts/BestSellers";
import NewArrivals from "./components/homeProducts/NewArrivals";
import ProductOfTheYear from "./components/homeProducts/ProductOfTheYear";
import SpecialOffers from "./components/homeProducts/SpecialOffers";
import CustomerReviews from "./components/homeProducts/CustomerReviews";
import Videos from "./components/homeProducts/Videos";
import TrustBadges from "./components/homeProducts/TrustBadges";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import {
    addCategories,
    addUser,
    removeUser,
    setOrderCount,
    resetOrderCount,
} from "./redux/orebiSlice";
import { serverUrl } from "../config";
import api from "./api/axiosInstance";

function App() {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);

    const fetchCategories = async () => {
        try {
            const response = await api.get(`/api/category`);

            if (response?.data?.success) {
                dispatch(addCategories(response.data.categories));
            };
        } catch (error) {
            console.error("Error fetching categories:", error);
        };
    };

    // Function to fetch user orders and update count
    const fetchUserOrderCount = useCallback(async (token) => {
        try {
            const response = await api.get(`/api/order/my-orders`);

            const data = response.data;
            if (data.success) {
                dispatch(setOrderCount(data.orders.length));
            } else if (data.message === "TOKEN_EXPIRED" || data.message === "INVALID_TOKEN") {
                // Auto-logout on token failure from backend
                localStorage.removeItem("token");
                dispatch(removeUser());
                dispatch(resetOrderCount());
            };
        } catch (error) {
            console.error("Error fetching order count:", error);
            // Don't show error to user as this is not critical
        };
    }, [dispatch]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            dispatch(removeUser());
            dispatch(resetOrderCount());
            setLoading(false);
            return;
        };

        try {
            const decoded = jwtDecode(token);

            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
                console.warn("Token expired, logging out");
                localStorage.removeItem("token");
                dispatch(removeUser());
                dispatch(resetOrderCount());
                setLoading(false);
                return;
            };

            dispatch(addUser(decoded));
            fetchUserOrderCount(token);
        } catch (error) {
            console.error("Invalid token:", error);
            localStorage.removeItem("token");
            dispatch(removeUser());
            dispatch(resetOrderCount());
        };

        setLoading(false);
    }, [dispatch, fetchUserOrderCount]);

    useEffect(() => {
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-screen flex flex-col justify-center items-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-medium text-gray-600 animate-pulse">Loading Storefront...</p>
            </div>
        );
    };

    return (
        <main className="w-full overflow-hidden">
            <Banner />
            <Container className="py-5 md:py-10">
                <TrustBadges />
                <NewArrivals />
                <BestSellers />
                {/* <ProductOfTheYear /> */}
                <SpecialOffers />
                <CustomerReviews />
            </Container>
            <Videos />
        </main>
    );
};

export default App;