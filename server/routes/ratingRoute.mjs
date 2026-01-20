import { Router } from "express";
import {
    addRating,
    listRatings,
    removeRating,
    singleRating,
    updateRating,
} from "../controllers/ratingController.mjs";
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";

const router = Router();

const routeValue = "/api/rating/";

router.post(`${routeValue}add`, userAuth, addRating);
router.post(`${routeValue}remove`, adminAuth, removeRating);
router.post(`${routeValue}update/:id`, adminAuth, updateRating);
router.get(`${routeValue}single`, singleRating);
router.get(`${routeValue}list`, listRatings);

export default router;
