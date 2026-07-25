import { useState, useEffect, useRef, useCallback } from "react";
import { FaClock } from "react-icons/fa";
import { serverUrl } from "../../../config";
import api from "../../api/axiosInstance";
import Title from "../ui/title";

const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const VideoItem = ({ video }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    const handleIntersection = useCallback((entries) => {
        entries.forEach((entry) => {
            const el = videoRef.current;
            if (!el) return;

            if (entry.isIntersecting) {
                el.play().catch(() => {});
            } else {
                el.pause();
            }
        });
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(handleIntersection, {
            threshold: 0.5,
        });

        observer.observe(el);

        return () => observer.disconnect();
    }, [handleIntersection]);

    return (
        <div ref={containerRef} className="w-full mb-6 last:mb-0">
            <div className="relative w-full">
                <video
                    ref={videoRef}
                    src={video.videoUrl}
                    muted
                    loop
                    playsInline
                    className="w-full aspect-video object-contain bg-black"
                    onError={(e) => {
                        e.target.style.display = "none";
                    }}
                />
                {video.duration > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white px-2.5 py-1 rounded text-xs flex items-center gap-1">
                        <FaClock className="text-xs" />
                        {formatDuration(video.duration)}
                    </div>
                )}
            </div>
            {/* <div className="py-3">
                <h3 className="font-semibold text-gray-900 mb-1">{video.title}</h3>
                {video.description && (
                    <p className="text-sm text-gray-500">{video.description}</p>
                )}
            </div> */}
        </div>
    );
};

const Videos = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

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

            <div className="w-full px-4">
                {videos.map((video) => (
                    <VideoItem key={video._id} video={video} />
                ))}
            </div>
        </div>
    );
};

export default Videos;
