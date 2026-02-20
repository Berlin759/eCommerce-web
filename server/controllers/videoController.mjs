import videoModel from "../models/videoModel.js";
import { cloudinary, deleteCloudinaryImage } from "../config/cloudinary.js";
import fs from "fs";

const cleanupTempFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        };
    } catch (error) {
        console.error("Error cleaning up temporary file:", error);
    };
};

const createVideo = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Video title is required",
            });
        };

        const existingVideo = await videoModel.findOne({
            title: { $regex: new RegExp(`^${title}$`, "i") },
        });

        if (existingVideo) {
            return res.status(400).json({
                success: false,
                message: "Video title already exists",
            });
        };

        let videoUrl = "";
        let thumbnail = "";
        let duration = 0;

        if (req.file) {
            try {
                const uploadResult = await uploadLargeAsync(req.file.path);

                videoUrl = uploadResult.secure_url;
                duration = uploadResult.duration || 0;

                if (uploadResult.eager && uploadResult.eager.length > 0) {
                    thumbnail = uploadResult.eager[0].secure_url;
                };

                cleanupTempFile(req.file.path);
            } catch (uploadError) {
                console.error("Video upload error:", uploadError);
                if (req.file?.path) {
                    cleanupTempFile(req.file.path);
                };

                return res.status(400).json({
                    success: false,
                    message: "Failed to upload video",
                });
            };
        } else {
            return res.status(400).json({
                success: false,
                message: "Video file is required",
            });
        };

        if (!videoUrl) {
            return res.status(400).json({
                success: false,
                message: "Failed to upload video",
            });
        };

        const newVideo = new videoModel({
            title,
            description,
            videoUrl,
            thumbnail,
            duration,
        });

        await newVideo.save();

        return res.status(200).json({
            success: true,
            message: "Video created successfully",
            video: newVideo,
        });
    } catch (error) {
        console.error("Create video error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    };
};

const getVideos = async (req, res) => {
    try {
        const videos = await videoModel
            .find({ isActive: true })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            videos: videos,
        });
    } catch (error) {
        console.error("Get videos error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    };
};

const getVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await videoModel.findById(id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        };

        return res.status(200).json({
            success: true,
            video: video,
        });
    } catch (error) {
        console.error("Get video error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    };
};

const updateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, isActive } = req.body;

        const video = await videoModel.findById(id);
        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        };

        let videoUrl = video.videoUrl;
        let thumbnail = video.thumbnail;
        let duration = video.duration;

        if (req.file) {
            try {
                if (video.videoUrl) {
                    const publicId = video.videoUrl.split("/").slice(-2).join("/").split(".")[0];
                    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
                };

                const uploadResult = await uploadLargeAsync(req.file.path);

                videoUrl = uploadResult.secure_url;
                duration = uploadResult.duration || 0;

                if (uploadResult.eager && uploadResult.eager.length > 0) {
                    thumbnail = uploadResult.eager[0].secure_url;
                };

                cleanupTempFile(req.file.path);
            } catch (uploadError) {
                console.error("Video upload error:", uploadError);
                if (req.file?.path) {
                    cleanupTempFile(req.file.path);
                };

                return res.status(400).json({
                    success: false,
                    message: "Failed to upload video",
                });
            };
        };

        const updatedVideo = await videoModel.findByIdAndUpdate(
            id,
            {
                title: title || video.title,
                description: description || video.description,
                videoUrl: videoUrl,
                thumbnail: thumbnail,
                duration: duration,
                isActive: isActive !== undefined ? isActive : video.isActive,
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Video updated successfully",
            video: updatedVideo,
        });
    } catch (error) {
        console.error("Update video error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    };
};

const deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;

        const video = await videoModel.findById(id);
        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        };

        if (video.videoUrl) {
            try {
                const publicId = video.videoUrl.split("/").slice(-2).join("/").split(".")[0];
                await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
            } catch (error) {
                console.error("Error deleting video from Cloudinary:", error);
            };
        };

        await videoModel.findByIdAndUpdate(id, { isActive: false });

        return res.status(200).json({
            success: true,
            message: "Video deleted successfully",
        });
    } catch (error) {
        console.error("Delete video error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    };
};

const uploadLargeAsync = (filePath) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(
            filePath,
            {
                folder: "orebi/videos",
                resource_type: "video",
                chunk_size: 6000000,
                eager: [
                    {
                        width: 640,
                        height: 360,
                        crop: "fill",
                        format: "jpg",
                        // resource_type: "video",
                    },
                ],
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
    });
};

export { createVideo, getVideos, getVideo, updateVideo, deleteVideo };
