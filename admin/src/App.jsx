import { Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Checkout from "./pages/Checkout";
import Banners from "./pages/Banners";
import Users from "./pages/Users";
import Analytics from "./pages/Analytics";
import Inventory from "./pages/Inventory";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import Contacts from "./pages/Contacts";
import Ratings from "./pages/Ratings";
import Invoice from "./pages/Invoice";
import ApiDocumentation from "./pages/ApiDocumentation";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Settings from "./pages/Settings";

function App() {
    const { token } = useSelector((state) => state.auth);

    return (
        <main className="bg-gray-50 min-h-screen">
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes */}
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <div className="min-h-screen">
                                {/* Premium Support Badge */}
                                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 text-center text-sm font-medium shadow-sm">
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        <span>💖</span>
                                        <span>Support our product & get the best product!</span>
                                        {/* <a
                                            href="https://buymeacoffee.com/reactbd"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors duration-200 text-xs font-semibold"
                                        >
                                            ☕ Buy Me a Coffee
                                        </a> */}
                                    </div>
                                </div>

                                {/* Layout */}
                                <Navbar />
                                <div className="flex w-full">
                                    <div className="w-16 sm:w-64 lg:w-72 fixed min-h-screen border-r-2 z-10">
                                        <Sidebar />
                                    </div>
                                    <div className="flex-1 px-3 sm:px-5 py-2 ml-16 sm:ml-64 lg:ml-72">
                                        <ScrollToTop />

                                        {/* Protected Pages */}
                                        <Routes>
                                            <Route path="/" element={<Home />} />
                                            <Route path="/analytics" element={<Analytics />} />
                                            {token && (
                                                <>
                                                    <Route path="/add" element={<Add token={token} />} />
                                                    <Route path="/list" element={<List token={token} />} />
                                                    <Route path="/orders" element={<Orders token={token} />} />
                                                    <Route path="/checkout/:orderId" element={<Checkout token={token} />} />
                                                    <Route path="/banners" element={<Banners token={token} />} />
                                                    <Route path="/users" element={<Users token={token} />} />
                                                    <Route path="/settings" element={<Settings token={token} />} />
                                                </>
                                            )}
                                            <Route path="/inventory" element={<Inventory />} />
                                            <Route path="/categories" element={<Categories />} />
                                            <Route path="/brands" element={<Brands />} />
                                            <Route path="/contacts" element={<Contacts />} />
                                            <Route path="/ratings" element={<Ratings />} />
                                            <Route path="/invoice" element={<Invoice />} />
                                            <Route path="/api-docs" element={<ApiDocumentation />} />
                                        </Routes>
                                    </div>
                                </div>
                            </div>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </main>
    );
}

export default App;
