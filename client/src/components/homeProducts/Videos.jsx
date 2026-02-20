import { useState, useEffect, useRef } from "react";
import { FaPlay, FaTimes, FaClock } from "react-icons/fa";
import { serverUrl } from "../../../config";
import api from "../../api/axiosInstance";
import Title from "../ui/title";

const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const Videos = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playingVideo, setPlayingVideo] = useState(null);
    const videoRef = useRef(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await api.get(`${serverUrl}/api/video`);
                if (response.data.success) {
                    setVideos(response.data.videos);
                }
            } catch (error) {
                console.error("Error fetching videos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    useEffect(() => {
        if (playingVideo && videoRef.current) {
            videoRef.current.play();
        }
    }, [playingVideo]);

    const handlePlayVideo = (video) => {
        setPlayingVideo(video);
    };

    const handleCloseVideo = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
        setPlayingVideo(null);
    };

    if (loading || videos.length === 0) {
        return null;
    }

    return (
        <div className="w-full py-10 bg-gray-50">
            <div className="mb-8 text-center">
                <Title>Watch Our Videos</Title>
                <p className="text-gray-600 mt-2 max-w-xl mx-auto">
                    Explore our collection of videos to learn more about our products and services
                </p>
            </div>

            <div className="px-4 max-w-7xl mx-auto">
                {videos.map((video) => (
                    <div
                        key={video._id}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group cursor-pointer"
                        onClick={() => handlePlayVideo(video)}
                    >
                        <div className="relative">
                            {video.thumbnail ? (
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full h-video object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-video bg-gray-200 flex items-center justify-center">
                                    <FaPlay className="text-4xl text-gray-400" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100">
                                    <FaPlay className="text-black text-2xl ml-1" />
                                </div>
                            </div>
                            {video.duration > 0 && (
                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                    <FaClock className="text-xs" />
                                    {formatDuration(video.duration)}
                                </div>
                            )}
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
                        </div>
                    </div>
                ))}
            </div>

            {playingVideo && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
                    onClick={handleCloseVideo}
                >
                    <div
                        className="relative max-w-4xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleCloseVideo}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <FaTimes className="text-2xl" />
                        </button>
                        <video
                            ref={videoRef}
                            src={playingVideo.videoUrl}
                            controls
                            autoPlay
                            className="w-full rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="mt-4 text-white">
                            <h3 className="text-xl font-semibold">{playingVideo.title}</h3>
                            {playingVideo.description && (
                                <p className="text-gray-400 mt-2">{playingVideo.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Videos;
