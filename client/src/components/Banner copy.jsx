import { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { serverUrl } from "../../config";
import api from "../api/axiosInstance";

const Banner = () => {
    const [banners, setBanners] = useState([]);
    const [isHovered, setIsHovered] = useState(false);
    const sliderRef = useRef(null);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await api.get(`${serverUrl}/api/banner`);
                const data = response.data;

                if (data.success) {
                    // Only show active banners
                    const activeBanners = data.banners.filter((b) => b.isActive);
                    setBanners(activeBanners);
                }
            } catch (error) {
                console.error("Error fetching banners:", error);
            }
        };

        fetchBanners();
    }, []);

    const settings = {
        dots: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 4000,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        fade: true,
        cssEase: "linear",
        appendDots: (dots) => (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <ul className="flex items-center gap-2">{dots}</ul>
            </div>
        ),
        customPaging: () => (
            <div className="w-3 h-3 bg-gray-400 rounded-full cursor-pointer hover:bg-gray-600 transition-all" />
        ),
    };

    if (!banners.length) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center bg-gray-100 text-gray-500">
                No banners available
            </div>
        );
    }

    return (
        <div
            className="w-full h-[60vh] relative overflow-hidden group bg-white"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Slider ref={sliderRef} {...settings}>
                {banners.map((banner, index) => (
                    <div key={banner._id || index} className="relative h-[60vh]">
                        <img
                            src={banner.image}
                            alt={banner.name || `Banner ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10" /> {/* subtle overlay */}
                    </div>
                ))}
            </Slider>

            {/* Navigation Arrows */}
            <div
                className={`absolute inset-y-0 left-0 flex items-center z-20 transition-opacity duration-300 ${
                    isHovered ? "opacity-100" : "opacity-0"
                }`}
            >
                <button
                    onClick={() => sliderRef.current?.slickPrev()}
                    className="ml-4 p-3 bg-gray-800/80 text-white hover:bg-gray-900 rounded-full transition-all"
                    aria-label="Previous slide"
                >
                    <HiChevronLeft className="w-6 h-6" />
                </button>
            </div>

            <div
                className={`absolute inset-y-0 right-0 flex items-center z-20 transition-opacity duration-300 ${
                    isHovered ? "opacity-100" : "opacity-0"
                }`}
            >
                <button
                    onClick={() => sliderRef.current?.slickNext()}
                    className="mr-4 p-3 bg-gray-800/80 text-white hover:bg-gray-900 rounded-full transition-all"
                    aria-label="Next slide"
                >
                    <HiChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default Banner;
