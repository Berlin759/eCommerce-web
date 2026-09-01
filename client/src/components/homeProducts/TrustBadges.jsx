import { FaShippingFast, FaShieldAlt, FaHeadset, FaUndoAlt } from "react-icons/fa";

const trustFeatures = [
    {
        id: 1,
        icon: FaShippingFast,
        title: "Free Fast Delivery",
        description: "Free shipping on all orders over ₹499 with tracking.",
    },
    {
        id: 2,
        icon: FaShieldAlt,
        title: "100% Secure Payment",
        description: "Protected payments powered by Razorpay & Stripe.",
    },
    {
        id: 3,
        icon: FaUndoAlt,
        title: "Easy 7-Day Returns",
        description: "Hassle-free return & instant replacement policy.",
    },
    {
        id: 4,
        icon: FaHeadset,
        title: "24/7 Dedicated Support",
        description: "Round the clock assistance via chat & phone.",
    },
];

const TrustBadges = () => {
    return (
        <section className="my-10 py-8 bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-3xl border border-gray-100 shadow-sm px-4 md:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {trustFeatures.map((feature) => {
                    const IconComponent = feature.icon;
                    return (
                        <div
                            key={feature.id}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center flex-shrink-0 shadow-md">
                                <IconComponent className="text-xl" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-0.5">
                                    {feature.title}
                                </h4>
                                <p className="text-xs text-gray-500 leading-snug">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default TrustBadges;
