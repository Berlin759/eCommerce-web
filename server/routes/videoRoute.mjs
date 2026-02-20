import express from "express";
import {
    createVideo,
    getVideos,
    getVideo,
    updateVideo,
    deleteVideo,
} from "../controllers/videoController.mjs";
import uploadVideo from "../middleware/videoUpload.mjs";
import adminAuth from "../middleware/adminAuth.js";

const videoRouter = express.Router();

const routeValue = "/api/video";

videoRouter.get(`${routeValue}`, getVideos);
videoRouter.get(`${routeValue}/:id`, getVideo);

videoRouter.post(
    `${routeValue}`,
    adminAuth,
    uploadVideo.single("video"),
    createVideo
);

videoRouter.put(
    `${routeValue}/:id`,
    adminAuth,
    uploadVideo.single("video"),
    updateVideo
);

videoRouter.delete(`${routeValue}/:id`, adminAuth, deleteVideo);

export default videoRouter;
