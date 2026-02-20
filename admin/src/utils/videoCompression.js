export const compressVideo = (file, options = {}) => {
    return new Promise((resolve, reject) => {
        const {
            maxWidthOrHeight = 1920,
            videoBitsPerSecond = 2500000,
        } = options;

        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            video.src = event.target.result;
            
            video.onloadedmetadata = () => {
                const duration = video.duration;
                const aspectRatio = video.videoWidth / video.videoHeight;
                let width = video.videoWidth;
                let height = video.videoHeight;

                if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
                    if (aspectRatio > 1) {
                        width = maxWidthOrHeight;
                        height = Math.round(maxWidthOrHeight / aspectRatio);
                    } else {
                        height = maxWidthOrHeight;
                        width = Math.round(maxWidthOrHeight * aspectRatio);
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const stream = canvas.captureStream(30);
                
                let mimeType = "video/webm";
                if (!MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
                    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
                        mimeType = "video/webm;codecs=vp8";
                    } else if (MediaRecorder.isTypeSupported("video/webm")) {
                        mimeType = "video/webm";
                    }
                }

                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType,
                    videoBitsPerSecond,
                });

                const chunks = [];
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: mimeType });
                    const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webm", {
                        type: mimeType,
                    });

                    URL.revokeObjectURL(video.src);
                    resolve(compressedFile);
                };

                mediaRecorder.onerror = (e) => {
                    URL.revokeObjectURL(video.src);
                    reject(e);
                };

                let currentTime = 0;
                const frameDuration = 1 / 30;
                let frameTimeout = null;

                const captureFrame = () => {
                    if (currentTime >= duration) {
                        mediaRecorder.stop();
                        return;
                    }

                    video.currentTime = currentTime;

                    const onSeeked = () => {
                        video.removeEventListener("seeked", onSeeked);
                        ctx.drawImage(video, 0, 0, width, height);
                        currentTime += frameDuration;
                        frameTimeout = setTimeout(captureFrame, 10);
                    };

                    video.addEventListener("seeked", onSeeked);
                };

                mediaRecorder.start();
                captureFrame();
            };

            video.onerror = () => {
                reject(new Error("Failed to load video file"));
            };
        };

        reader.onerror = () => {
            reject(new Error("Failed to read video file"));
        };
    });
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
