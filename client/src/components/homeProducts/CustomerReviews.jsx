import { useEffect, useState } from "react";
import { MdStar } from "react-icons/md";
import { FaUserAlt } from "react-icons/fa";
import Title from "../ui/title";
import { getData } from "../../helpers";
import { serverUrl } from "../../../config";

const CustomerReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const endpoint = `${serverUrl}/api/rating/list?limit=5`;

    useEffect(() => {
        const getReviews = async () => {
            setLoading(true);
            try {
                const data = await getData(endpoint);
                setReviews(data?.ratings || []);
            } catch (error) {
                console.error("Error fetching reviews:", error);
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };
        getReviews();
    }, [endpoint]);

    if (loading) {
        return (
            <div className="w-full py-10">
                <Title className="text-2xl mb-3 font-bold">Customer Reviews</Title>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 animate-pulse"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
                                    <div className="flex gap-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="w-3.5 h-3.5 bg-gray-200 rounded"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="h-3 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded mb-2 w-4/5"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full py-10">
            <Title className="text-2xl mb-3 font-bold">Customer Reviews</Title>

            {reviews && reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {reviews.map((review) => (
                        <div
                            key={review?._id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                    <FaUserAlt className="text-green-600 text-xs" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-medium text-gray-900 text-sm truncate">
                                        {review?.displayName || review?.userId?.name || "Anonymous"}
                                    </h4>
                                    <div className="flex items-center">
                                        {Array.from({ length: 5 }).map((_, starIndex) => (
                                            <MdStar
                                                key={starIndex}
                                                className={`w-3.5 h-3.5 ${
                                                    starIndex < review?.rating
                                                        ? "text-yellow-400"
                                                        : "text-gray-300"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {review?.productId?.name && (
                                <p className="text-xs text-green-600 font-medium mb-2 truncate">
                                    {review?.productId?.name}
                                </p>
                            )}

                            <p className="text-gray-600 text-sm leading-relaxed flex-1">
                                {review?.description || "No comment provided."}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p>No reviews available yet.</p>
                </div>
            )}
        </div>
    );
};

export default CustomerReviews;
