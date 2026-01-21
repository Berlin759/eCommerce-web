import Contact from "../models/contactModel.js";
import userModel from "../models/userModel.js";

export const createContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        const userId = req.user.id;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        };

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        };

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        };

        const contact = new Contact({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
            userId,
        });

        await contact.save();

        await contact.populate("userId");

        return res.status(200).json({
            success: true,
            message: "Your message has been sent successfully! We'll get back to you soon.",
            data: contact,
        });
    } catch (error) {
        console.error("Create contact error------------->", error);

        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(", "),
            });
        };

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format",
            });
        };

        return res.status(500).json({
            success: false,
            message: "Failed to send message. Please try again.",
        });
    };
};

export const getAllContacts = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;

        const filter = {};
        if (status && status !== "all") {
            filter.status = status;
        };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { subject: { $regex: search, $options: "i" } },
                { message: { $regex: search, $options: "i" } },
            ];
        };

        const contacts = await Contact.find(filter)
            .populate("userId")
            .sort({ _id: -1 })
            // .limit(limit * 1)
            // .skip((page - 1) * limit);

        const total = await Contact.countDocuments(filter);

        const statusCounts = await Contact.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        const counts = {
            unread: 0,
            read: 0,
            replied: 0,
            total,
        };

        statusCounts.forEach((item) => {
            counts[item._id] = item.count;
        });

        return res.status(200).json({
            success: true,
            data: contacts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
            counts,
        });
    } catch (error) {
        console.error("Get contacts error--------------->", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch contacts",
        });
    };
};

export const getContactById = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findById(id).populate("userId");

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found",
            });
        };

        return res.status(200).json({
            success: true,
            data: contact,
        });
    } catch (error) {
        console.error("Get contact by ID error-------------->", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch contact message",
        });
    };
};

export const updateContactStatus = async (req, res) => {
    try {
        const { contactUsId, status, adminNotes } = req.body;

        if (!["unread", "read", "replied"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        };

        const updatePayload = {
            status: status,
        };

        if (adminNotes) {
            updatePayload["adminNotes"] = adminNotes;
        };

        const contact = await Contact.findByIdAndUpdate(
            contactUsId,
            updatePayload,
            { new: true }
        ).populate("userId");

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact status update failed. Please try again!",
            });
        };

        return res.status(200).json({
            success: true,
            message: "Contact status updated successfully",
            data: contact,
        });
    } catch (error) {
        console.error("Update contact status error-------------->", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update contact status",
        });
    };
};

export const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findByIdAndDelete(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found",
            });
        };

        return res.status(200).json({
            success: true,
            message: "Contact message deleted successfully",
        });
    } catch (error) {
        console.error("Delete contact error---------------->", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete contact message",
        });
    };
};

export const getUserContacts = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        // const contacts = await Contact.find({ userId })
        //     .sort({ _id: -1 })
        //     .limit(limit * 1)
        //     .skip((page - 1) * limit);

        const contacts = await Contact.find({ userId })
            .populate("userId")
            .sort({ _id: -1 });

        const total = await Contact.countDocuments({ userId });

        return res.status(200).json({
            success: true,
            data: contacts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Get user contacts error---------->", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch your messages",
        });
    };
};