import { motion } from "framer-motion";
import { FaTools, FaEnvelope, FaHome } from "react-icons/fa";

const Maintenance = ({ message }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
            <div className="text-center max-w-2xl mx-auto">
                {/* Icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <div className="relative inline-block">
                        <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                            <FaTools className="w-16 h-16 text-orange-500" />
                        </div>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
                        >
                            <span className="text-white text-lg">⚙</span>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-6"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Under Maintenance
                    </h1>
                    <p className="text-xl text-gray-600 mb-2">
                        {message || "We are currently performing scheduled maintenance. Please check back later."}
                    </p>
                </motion.div>

                {/* Progress Bar Animation */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mb-10"
                >
                    <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                    <p className="text-sm text-gray-500 mt-3">We&apos;re working hard to get back online</p>
                </motion.div>

                {/* Info Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10"
                >
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <FaHome className="w-6 h-6 text-blue-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-1">Back Soon</h3>
                        <p className="text-sm text-gray-500">
                            We&apos;ll be back online shortly. Thank you for your patience.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <FaEnvelope className="w-6 h-6 text-green-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-1">Need Help?</h3>
                        <p className="text-sm text-gray-500">
                            Contact us at support for any urgent queries.
                        </p>
                    </div>
                </motion.div>

                {/* Fun Fact */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100"
                >
                    <div className="text-4xl mb-4">🔧</div>
                    <p className="text-gray-600">
                        <strong>Did you know?</strong> Regular maintenance helps us provide you
                        with a better, faster, and more secure shopping experience!
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Maintenance;
