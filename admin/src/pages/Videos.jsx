import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Container from "../components/Container";
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaVideo,
    FaSearch,
    FaSync,
    FaPlay,
    FaClock,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { serverUrl } from "../../config";
import api from "../api/axiosInstance";
import { compressVideo, formatFileSize } from "../utils/videoCompression";

const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const Videos = () => {
    const { token } = useSelector((state) => state.auth);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        video: null,
    });
    const [videoPreview, setVideoPreview] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [compressing, setCompressing] = useState(false);

    const fetchVideos = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`${serverUrl}/api/video`);
            const data = response.data;

            if (data.success) {
                setVideos(data.videos);
            } else {
                toast.error(data.message || "Failed to fetch videos");
            }
        } catch (error) {
            console.error("Fetch videos error:", error);
            if (error.response && error.response.data) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to fetch videos");
            }
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleVideoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024 * 1024) {
                toast.error("Video file size must be less than 1GB");
                return;
            };

            let videoFile = file;

            if (file.size > 100 * 1024 * 1024) {
                setCompressing(true);
                toast.loading("Compressing video...", { id: "compress" });
                try {
                    videoFile = await compressVideo(file, {
                        maxSizeMB: 80,
                        maxWidthOrHeight: 1920,
                        videoBitsPerSecond: 2500000,
                    });
                    toast.success(`Compressed: ${formatFileSize(file.size)} → ${formatFileSize(videoFile.size)}`, { id: "compress" });
                } catch (error) {
                    console.error("Compression error:", error);
                    toast.error("Compression failed. Uploading original file.", { id: "compress" });
                    videoFile = file;
                } finally {
                    setCompressing(false);
                }
            }

            setFormData((prev) => ({
                ...prev,
                video: videoFile,
            }));
            setVideoPreview(URL.createObjectURL(videoFile));
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error("Video title is required");
            return;
        };

        if (!formData.video && !editingVideo) {
            toast.error("Video file is required");
            return;
        };

        setSubmitting(true);
        setUploadProgress(0);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("title", formData.title);

            if (formData.description) {
                formDataToSend.append("description", formData.description);
            };

            if (formData.video) {
                formDataToSend.append("video", formData.video);
            };

            const config = {
                header: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                },
            };

            let response;
            if (editingVideo) {
                response = await api.put(
                    `${serverUrl}/api/video/${editingVideo._id}`,
                    formDataToSend,
                    config,
                );
            } else {
                response = await api.post(
                    `${serverUrl}/api/video`,
                    formDataToSend,
                    config,
                );
            };

            const result = response.data;

            if (result.success) {
                toast.success(
                    editingVideo
                        ? "Video updated successfully"
                        : "Video uploaded successfully"
                );
                fetchVideos();
                closeModal();
            } else {
                toast.error(result.message || "Failed to save video");
            };
        } catch (error) {
            console.error("Submit video error:", error);
            if (error.response && error.response.data) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to save video");
            };
        } finally {
            setSubmitting(false);
            setUploadProgress(0);
        };
    };

    const handleDelete = async (videoId) => {
        if (!window.confirm("Are you sure you want to delete this video?")) {
            return;
        };

        try {
            const response = await api.delete(`${serverUrl}/api/video/${videoId}`);
            const data = response.data;

            if (data.success) {
                toast.success("Video deleted successfully");
                fetchVideos();
            } else {
                toast.error(data.message || "Failed to delete video");
            };
        } catch (error) {
            console.error("Delete video error:", error);
            if (error.response && error.response.data) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to delete video");
            };
        };
    };

    const openModal = (video = null) => {
        if (video) {
            setEditingVideo(video);
            setFormData({
                title: video.title,
                description: video.description || "",
                video: null,
            });
            setVideoPreview(video.videoUrl);
        } else {
            setEditingVideo(null);
            setFormData({
                title: "",
                description: "",
                video: null,
            });
            setVideoPreview("");
        };
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingVideo(null);
        setFormData({
            title: "",
            description: "",
            video: null,
        });
        setVideoPreview("");
        setUploadProgress(0);
    };

    const filteredVideos = videos.filter((video) =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            Videos
                        </h1>
                        <p className="text-gray-600 mt-1">Manage your videos (Max 1GB)</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchVideos}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            title="Refresh Videos"
                        >
                            <FaSync className="w-4 h-4" />
                            Refresh
                        </button>
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <FaPlus />
                            Add Video
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search videos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse"
                            >
                                <div className="w-full h-48 bg-gray-200"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    <div className="flex gap-2 mt-4">
                                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredVideos.length === 0 ? (
                    <div className="text-center py-12">
                        <FaVideo className="mx-auto text-6xl text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            {searchTerm ? "No videos found" : "No videos yet"}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {searchTerm
                                ? "Try adjusting your search terms"
                                : "Start by uploading your first video"}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => openModal()}
                                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Upload Video
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredVideos.map((video) => (
                            <div
                                key={video._id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="relative group">
                                    {video.thumbnail ? (
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                            <FaVideo className="text-4xl text-gray-400" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                        <div className="w-14 h-14 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <FaPlay className="text-black text-xl ml-1" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                        <FaClock className="text-xs" />
                                        {formatDuration(video.duration)}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                                        {video.title}
                                    </h3>
                                    {video.description && (
                                        <p className="text-sm text-gray-500 line-clamp-2">
                                            {video.description}
                                        </p>
                                    )}
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => window.open(video.videoUrl, '_blank')}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                        >
                                            <FaPlay className="text-xs" />
                                            Play
                                        </button>
                                        <button
                                            onClick={() => openModal(video)}
                                            className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                        >
                                            <FaEdit className="text-xs" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(video._id)}
                                            className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                        >
                                            <FaTrash className="text-xs" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showModal && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        onClick={(e) => {
                            if (e.target === e.currentTarget && !submitting) {
                                closeModal();
                            }
                        }}
                    >
                        <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-semibold">
                                    {editingVideo ? "Edit Video" : "Add Video"}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600"
                                    disabled={submitting}
                                >
                                    <IoMdClose size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Video Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="Enter video title"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="Enter video description"
                                        rows={3}
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Video File {!editingVideo && "*"}
                                        <span className="text-xs text-gray-500 ml-2">(Max 1GB)</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        disabled={submitting || compressing}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Supported formats: MP4, WebM, MOV, AVI
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Videos over 100MB will be auto-compressed
                                    </p>
                                    {videoPreview && (
                                        <div className="mt-3">
                                            {editingVideo && !formData.video ? (
                                                <div className="relative">
                                                    <video
                                                        src={videoPreview}
                                                        controls
                                                        className="w-full h-48 object-cover rounded-lg border"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Current video (select new file to replace)
                                                    </p>
                                                </div>
                                            ) : (
                                                <video
                                                    src={videoPreview}
                                                    controls
                                                    className="w-full h-48 object-cover rounded-lg border"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {submitting && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            {/* <FaCloudUploadAlt className="text-lg" /> */}
                                            <span>Uploading Video...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-black h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        {/* <p className="text-xs text-gray-500 text-center">
                                            {uploadProgress < 50
                                                ? "Preparing upload..."
                                                : uploadProgress < 80
                                                    ? "Uploading video..."
                                                    : "Processing video..."}
                                        </p> */}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={submitting || compressing}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || compressing}
                                        className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {compressing ? "Compressing..." : submitting ? "Uploading..." : editingVideo ? "Update" : "Upload"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Container>
    );
};

export default Videos;
