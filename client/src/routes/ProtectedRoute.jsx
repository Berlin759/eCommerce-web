import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const localToken = localStorage.getItem("token");

    // If no token → redirect to login
    if (!localToken) {
        return <Navigate to="/signin" replace />;
    };

    return children;
};

export default ProtectedRoute;