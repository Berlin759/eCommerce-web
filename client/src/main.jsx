import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import "./styles/index.css";
import ProtectedRoute from "./routes/ProtectedRoute";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import About from "./pages/About.jsx";
import Cart from "./pages/Cart.jsx";
import Contact from "./pages/Contact.jsx";
import Offers from "./pages/Offers.jsx";
import Order from "./pages/Order.jsx";
import Product from "./pages/Product.jsx";
import Shop from "./pages/Shop.jsx";
import SingleProduct from "./pages/SingleProduct.jsx";
import RootLayout from "./components/RootLayout.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Checkout from "./pages/Checkout.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import FAQ from "./pages/FAQ.jsx";
import Blog from "./pages/Blog.jsx";

const router = createBrowserRouter(
    [
        {
            path: "/",
            element: <RootLayout />,
            children: [
                {
                    path: "/",
                    element: <App />,
                },
                {
                    path: "/about",
                    element: <About />,
                },
                {
                    path: "/cart",
                    element: <Cart />,
                },
                {
                    path: "/contact",
                    element: <Contact />,
                },
                {
                    path: "/faq",
                    element: <FAQ />,
                },
                {
                    path: "/blog",
                    element: <Blog />,
                },
                {
                    path: "/offers",
                    element: <Offers />,
                },
                {
                    path: "/Product",
                    element: <Product />,
                },
                {
                    path: "/product/:id",
                    element: <SingleProduct />,
                },
                {
                    path: "/shop",
                    element: <Shop />,
                },
                {
                    path: "/signin",
                    element: <SignIn />,
                },
                {
                    path: "/signup",
                    element: <SignUp />,
                },
                {
                    path: "/orders",
                    element: (
                        <ProtectedRoute>
                            <Order />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "/profile",
                    element: (
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "/wishlist",
                    element: (
                        <ProtectedRoute>
                            <Wishlist />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "/checkout/:orderId",
                    element: (
                        <ProtectedRoute>
                            <Checkout />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "/payment-success",
                    element: (
                        <ProtectedRoute>
                            <PaymentSuccess />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "*",
                    element: <NotFound />,
                },
            ],
        },
    ],
    {
        future: {
            v7_startTransition: true,
        },
    }
);

createRoot(document.getElementById("root")).render(
    <RouterProvider router={router} />
);
