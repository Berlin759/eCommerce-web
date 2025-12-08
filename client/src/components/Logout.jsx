import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { removeUser } from "../redux/orebiSlice";

const Logout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        localStorage.removeItem("token");
        dispatch(removeUser());
        toast.success("log out successfully");
        // navigate("/");
        window.location.href = "/";
    };
    return (
        <Button onClick={handleLogout} className="px-8 py-2.5">
            Logout
        </Button>
    );
};

export default Logout;
