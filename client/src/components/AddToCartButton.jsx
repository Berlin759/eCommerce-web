import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
    addToCart,
    decreaseQuantity,
    increaseQuantity,
    setOrderCount,
} from "../redux/orebiSlice";
import { FaMinus, FaPlus } from "react-icons/fa";
import { cn } from "./ui/cn";
import api from "../api/axiosInstance";
import { serverUrl } from "../../config";

const AddToCartButton = ({ item, className, showBuyNow = false }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { products } = useSelector((state) => state.orebiReducer);
    const userInfo = useSelector((state) => state.orebiReducer.userInfo);
    const orderCount = useSelector((state) => state.orebiReducer.orderCount);
    const [existingProduct, setExistingProduct] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);

    useEffect(() => {
        const availableItem = products.find(
            (product) => product?._id === item?._id
        );

        setExistingProduct(availableItem || null);

        if (userInfo) {
            fetchAddresses();
        };
    }, [products, item, userInfo]);

    const fetchAddresses = async () => {
        try {
            const response = await api.get(`${serverUrl}/api/user/addresses`);
            const data = response.data;
            if (data.success) {
                setAddresses(data.addresses);
                // Set default address as selected
                const defaultAddr = data.addresses.find((addr) => addr.isDefault);
                if (defaultAddr) {
                    setSelectedAddress(defaultAddr);
                };
            };
        } catch (error) {
            console.error("Error fetching addresses:", error);
        };
    };

    const handleAddToCart = () => {
        dispatch(addToCart(item));
        toast.success(`${item?.name.substring(0, 10)}... is added successfully!`);
    };

    const handleBuyNow = async () => {
        if (!item) return;

        if (!userInfo) {
            navigate("/signin");
            // toast.error("Please login to place an order");
            return;
        };

        if (!selectedAddress) {
            toast.error("Please add a delivery address on profile");
            return;
        };

        try {
            const response = await api.post(`${serverUrl}/api/order/create`, {
                items: [{ ...item, quantity: 1 }],
                amount: item.price,
                // address: null, // select later on checkout page
                address: {
                    ...selectedAddress,
                    email: userInfo.email,
                    name: userInfo.name,
                },
            });

            const data = response.data;

            if (data.success) {
                toast.success("Order buy successfully!");
                dispatch(setOrderCount(orderCount + 1));
                window.location.href = `/checkout/${data.orderId}`;
            } else {
                console.error("error", data);

                toast.error(data.message || "Failed to buy now");
            };
        } catch (error) {
            console.error(error);
            console.error("Error buy now handle:", error);
            toast.error("Failed to buy now");
        };
    };

    return (
        <>
            {existingProduct ? (
                <div
                    className={cn(
                        "flex self-start items-center justify-center gap-3 py-2",
                        className
                    )}
                >
                    <button
                        disabled={existingProduct?.quantity <= 1}
                        onClick={() => {
                            dispatch(decreaseQuantity(item?._id));
                            toast.success("Quantity decreased successfully!");
                        }}
                        className="border border-gray-300 text-gray-700 p-2 hover:border-black hover:text-black rounded-md text-sm transition-all duration-200 cursor-pointer disabled:text-gray-300 disabled:border-gray-200 disabled:hover:border-gray-200 disabled:hover:text-gray-300"
                    >
                        <FaMinus />
                    </button>
                    <p className="text-sm font-medium w-8 text-center">
                        {existingProduct?.quantity || 0}
                    </p>
                    <button
                        onClick={() => {
                            dispatch(increaseQuantity(item?._id));
                            toast.success("Quantity increased successfully!");
                        }}
                        className="border border-gray-300 text-gray-700 p-2 hover:border-black hover:text-black rounded-md text-sm transition-all duration-200 cursor-pointer"
                    >
                        <FaPlus />
                    </button>
                </div>
            ) : (
                <div>
                    <button
                        onClick={handleAddToCart}
                        className="w-full border border-black text-black text-xs font-medium py-3 px-6 uppercase tracking-wide hover:bg-black hover:text-white transition-all duration-200"
                    >
                        Add to cart
                    </button>
                    {/* {showBuyNow && ( */}
                        <button
                            onClick={handleBuyNow}
                            className="w-full border border-black text-black text-xs font-medium py-3 px-6 mt-5 uppercase tracking-wide hover:bg-black hover:text-white transition-all duration-200"
                        >
                            Buy Now
                        </button>
                    {/* )} */}
                </div>
            )}
        </>
    );
};

AddToCartButton.propTypes = {
    item: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
    }).isRequired,
    className: PropTypes.string,
    showBuyNow: PropTypes.bool,
};

export default AddToCartButton;
