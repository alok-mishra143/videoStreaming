import express from "express";
import {
  uploadVideo,
  getVideos,
  getVideoById,
  streamVideo,
  deleteVideo,
} from "../controllers/videoController";
import { protect } from "../middleware/authMiddleware";
import upload from "../middleware/uploadMiddleware";

const router = express.Router();

router
  .route("/")
  .post(protect, upload.single("video"), uploadVideo)
  .get(protect, getVideos);

router.route("/:id").get(protect, getVideoById).delete(protect, deleteVideo);

router.route("/stream/:id").get(streamVideo); // Stream might need to be public or handle auth via query param

export default router;
