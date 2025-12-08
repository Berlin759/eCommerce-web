import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ContactsSkeleton from "../components/skeletons/ContactsSkeleton";
import Title from "../components/ui/title";
import Container from "../components/Container";
import { serverUrl } from "../../config";
import {
    FaEdit,
    FaTrash,
    FaSearch,
    FaUser,
    FaShoppingBag,
    FaCreditCard,
    FaClock,
    FaCheckCircle,
    FaBox,
    FaTimes,
    FaSort,
    FaSync,
    FaEnvelope,
    FaPaperPlane,
} from "react-icons/fa";
import { IoMdAdd, IoMdAddCircle, IoMdAddCircleOutline } from "react-icons/io";
import api from "../api/axiosInstance";

const Contact = () => {
    const navigate = useNavigate();
    const userInfo = useSelector((state) => state.orebiReducer.userInfo);
    const token = localStorage.getItem("token");

    const [contactUs, setContactUs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAddContactUs = () => {
        setShowAddModal(true);
        setForm({
            name: "",
            email: "",
            subject: "",
            message: "",
        });
    };

    const fetchContactUs = async () => {
        try {
            setLoading(true);
            const response = await api.get(`${serverUrl}/api/contact/my-contacts`);

            const result = response.data;
            if (result.success) {
                setContactUs(result.data);
            } else {
                toast.error(result.message || "Failed to fetch contactUs");
            };
        } catch (error) {
            console.error("Error fetching contactUs:", error);
            toast.error("Failed to load contactUs");
        } finally {
            setLoading(false);
        };
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "unread":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "read":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "replied":
                return "bg-green-100 text-green-800 border-green-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        };
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case "unread":
                return <FaClock className="w-3 h-3" />;
            case "read":
                return <FaCheckCircle className="w-3 h-3" />;
            case "replied":
                return <FaBox className="w-3 h-3" />;
            default:
                return <FaClock className="w-3 h-3" />;
        };
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        if (!form.name || !form.email || !form.message) {
            return toast.error("All fields are required");
        }

        try {
            const response = await api.post(`${serverUrl}/api/contact/create`, form);

            const data = response.data;

            if (data.success) {
                setShowAddModal(false);
                toast.success("Message sent successfully");
                setForm({
                    name: "",
                    email: "",
                    subject: "",
                    message: "",
                });
            } else {
                toast.error(data.message || "Failed to submit message");
            };
        } catch (error) {
            console.error("submit message error------------>", error);
            toast.error("Failed to submit message");
        };
    };

    useEffect(() => {
        if (!userInfo) {
            navigate("/signin");
            return;
        } else {
            fetchContactUs();
        };
    }, [userInfo, navigate]);

    if (loading) {
        return (
            <div>
                <Title>ContactUs List</Title>
                <div className="mt-6">
                    <ContactsSkeleton />
                </div>
            </div>
        );
    };

    return (
        <Container>
            <div className="flex items-center justify-between mb-6">
                <Title>ContactUs List</Title>
                <div className="flex items-center justify-between">
                    <button
                        onClick={fetchContactUs}
                        className="flex items-center gap-2 px-4 py-2 mx-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        title="Refresh ContactUs"
                    >
                        <FaSync className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={handleAddContactUs}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        title="Refresh ContactUs"
                    >
                        <IoMdAddCircleOutline className="w-4 h-4" />
                        Create Contact Support
                    </button>
                </div>
            </div>

            {/* ContactUs Table - Desktop */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ContactUs ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Message
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Admin Notes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {contactUs.map((contactUs) => (
                                <tr key={contactUs._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            #{contactUs._id.slice(-8).toUpperCase()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8">
                                                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <FaUser className="w-4 h-4 text-gray-600" />
                                                </div>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {contactUs.userId?.name || "N/A"}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {contactUs.userId?.email || "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <FaEnvelope className="w-4 h-4 mr-2 text-gray-400" />
                                            {contactUs.email || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            {contactUs.subject || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {contactUs.message || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="text-sm text-gray-900">
                                            {contactUs.adminNotes || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                contactUs.status
                                            )}`}
                                        >
                                            {getStatusIcon(contactUs.status)}
                                            {contactUs.status.charAt(0).toUpperCase() + contactUs.status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {contactUs.length === 0 && (
                    <div className="text-center py-12">
                        <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No ContactUs found
                        </h3>
                        <p className="text-gray-500">
                            No contactUs have been placed yet
                        </p>
                    </div>
                )}
            </div>

            {/* ContactUs Cards - Mobile/Tablet */}
            <div className="lg:hidden space-y-4">
                {contactUs.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No ContactUs found
                        </h3>
                        <p className="text-gray-500">
                            No contactUs have been placed yet
                        </p>
                    </div>
                ) : (
                    contactUs.map((contactUs) => (
                        <div
                            key={contactUs._id}
                            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                        <FaUser className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            #{contactUs._id.slice(-8).toUpperCase()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {contactUs.userId?.name || "N/A"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-3">
                                <div className="text-sm text-gray-600 mb-1">Customer Email</div>
                                <div className="text-sm font-medium text-gray-900">
                                    {contactUs.userId?.email || "N/A"}
                                </div>
                            </div>

                            {/* ContactUs Details */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Subject</div>
                                    <div className="flex items-center text-sm text-gray-900">
                                        {contactUs.subject || "N/A"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Message</div>
                                    <div className="text-sm text-gray-900">
                                        {contactUs.message}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Admin Notes</div>
                                    <div className="text-sm text-gray-900">
                                        {contactUs.adminNotes}
                                    </div>
                                </div>
                            </div>

                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                        contactUs.status
                                    )}`}
                                >
                                    {getStatusIcon(contactUs.status)}
                                    {contactUs.status.charAt(0).toUpperCase() + contactUs.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Message Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
                    <div className="relative top-10 mx-auto p-5 border w-full max-w-md bg-gray-50 shadow-lg rounded-md bg-white">
                        <form onSubmit={submitHandler}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 pr-2">
                                    Add Contact Support
                                </h2>
                                <button
                                    onClick={() => { setShowAddModal(false); }}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mb-4">
                                <label className="text-gray-700">Name</label>
                                <div className="flex items-center gap-2 border px-3 py-2 rounded-md bg-white">
                                    <FaUser className="text-gray-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Your Name"
                                        className="w-full outline-none"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-gray-700">Email</label>
                                <div className="flex items-center gap-2 border px-3 py-2 rounded-md bg-white">
                                    <FaEnvelope className="text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="Your Email"
                                        className="w-full outline-none"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-gray-700">Subject</label>
                                <div className="flex items-center gap-2 border px-3 py-2 rounded-md bg-white">
                                    <input
                                        type="text"
                                        name="subject"
                                        value={form.subject}
                                        onChange={handleChange}
                                        placeholder="Your subject"
                                        className="w-full outline-none"
                                    />
                                </div>
                            </div>

                            <div className="mb-5">
                                <label className="text-gray-700">Message</label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="Write your issue or feedback..."
                                    className="w-full border p-3 rounded-md bg-white outline-none h-32"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                            >
                                <FaPaperPlane />
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Container>
    );
};

export default Contact;