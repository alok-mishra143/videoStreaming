import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    filename: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    sensitivity: {
      type: String,
      enum: ["safe", "flagged", "pending"],
      default: "pending",
    },
    duration: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Video = mongoose.model("Video", videoSchema);

export default Video;
