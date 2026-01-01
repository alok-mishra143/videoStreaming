import type { Request, Response } from "express";
import Video from "../models/Video";
import Organization from "../models/Organization";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import path from "path";
import fs from "fs";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

if (!process.env.SIGHT_ENGINE_USER || !process.env.SIGHT_ENGINE_SECRET) {
  console.error("Missing SightEngine credentials in environment variables!");
} else {
  console.log("SightEngine credentials found.");
}

// Sensitivity analysis using SightEngine (Frame-based)
const analyzeSensitivity = (videoPath: string): Promise<string> => {
  console.log(`[Sensitivity Analysis] Starting analysis for: ${videoPath}`);
  return new Promise((resolve) => {
    const screenshotsDir = path.join(path.dirname(videoPath), "temp_frames");
    if (!fs.existsSync(screenshotsDir)) {
      console.log(
        `[Sensitivity Analysis] Creating temp directory: ${screenshotsDir}`
      );
      fs.mkdirSync(screenshotsDir);
    }

    const filename = path.basename(videoPath, path.extname(videoPath));

    ffmpeg(videoPath)
      .on("end", async () => {
        console.log(
          "[Sensitivity Analysis] FFmpeg screenshots generation completed"
        );
        try {
          const frames = fs
            .readdirSync(screenshotsDir)
            .filter((f) => f.startsWith(filename));

          console.log(
            `[Sensitivity Analysis] Found ${frames.length} frames to analyze`
          );
          let isUnsafe = false;

          for (const frame of frames) {
            const framePath = path.join(screenshotsDir, frame);
            try {
              // SightEngine check for local files using manual fetch
              console.log(
                `[Sensitivity Analysis] Sending frame to SightEngine: ${frame}`
              );

              const formData = new FormData();
              formData.append("api_user", process.env.SIGHT_ENGINE_USER!);
              formData.append("api_secret", process.env.SIGHT_ENGINE_SECRET!);
              formData.append("models", "nudity,wad,offensive,gore");

              const fileBuffer = fs.readFileSync(framePath);
              const blob = new Blob([fileBuffer]);
              formData.append("media", blob, frame);

              const response = await fetch(
                "https://api.sightengine.com/1.0/check.json",
                {
                  method: "POST",
                  body: formData,
                }
              );

              const result: any = await response.json();

              console.log(
                `[Sensitivity Analysis] SightEngine result for ${frame}:`,
                JSON.stringify(result)
              );

              if (
                (result.nudity && result.nudity.safe < 0.5) ||
                (result.weapon && result.weapon > 0.5) ||
                (result.alcohol && result.alcohol > 0.5) ||
                (result.drugs && result.drugs > 0.5) ||
                (result.offensive && result.offensive.prob > 0.5) ||
                (result.gore && result.gore.prob > 0.5)
              ) {
                console.log(
                  `[Sensitivity Analysis] Frame flagged as unsafe: ${frame}`
                );
                isUnsafe = true;
              }
            } catch (e) {
              console.error("[Sensitivity Analysis] SightEngine error:", e);
            }
            // Cleanup frame
            try {
              if (fs.existsSync(framePath)) fs.unlinkSync(framePath);
            } catch (e) {}
          }

          // Cleanup dir if empty
          try {
            if (fs.readdirSync(screenshotsDir).length === 0) {
              fs.rmdirSync(screenshotsDir);
            }
          } catch (e) {}

          const finalResult = isUnsafe ? "flagged" : "safe";
          console.log(`[Sensitivity Analysis] Final result: ${finalResult}`);
          resolve(finalResult);
        } catch (err) {
          console.error("[Sensitivity Analysis] Error processing frames:", err);
          resolve("safe");
        }
      })
      .on("error", (err) => {
        console.error("[Sensitivity Analysis] FFmpeg error:", err);
        resolve("safe");
      })
      .screenshots({
        count: 3,
        folder: screenshotsDir,
        filename: `${filename}-at-%s-seconds.png`,
      });
  });
};

// @desc    Upload a video
// @route   POST /api/videos
// @access  Private
export const uploadVideo = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const { title, description, orgId } = req.body;

    // Determine Organization
    let organizationId = orgId;
    if (!organizationId) {
      // Default to user's owned organization
      const org = await Organization.findOne({ owner: req.user._id });
      if (org) {
        organizationId = org._id;
      } else {
        // Should not happen if registered correctly, but handle it
        res.status(400).json({ message: "Organization not found" });
        return;
      }
    }

    // Verify permissions for upload (Owner or Editor)
    const org = await Organization.findById(organizationId);
    if (!org) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    const isOwner = org.owner.toString() === req.user._id.toString();
    const member = org.members.find(
      (m: any) => m.user.toString() === req.user._id.toString()
    );
    const isEditor = member && member.role === "editor";

    if (!isOwner && !isEditor) {
      res
        .status(403)
        .json({ message: "Not authorized to upload to this organization" });
      return;
    }

    const video = await Video.create({
      user: req.user._id,
      organization: organizationId,
      title,
      description,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      status: "processing",
    });

    res.status(201).json(video);

    // Start processing in background
    const io = req.app.get("io");
    console.log(
      `[Upload] Starting background processing for video ${video._id}`
    );

    // Simulate processing steps
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      io.emit(`video-progress-${video._id}`, {
        progress,
        status: "processing",
      });

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 500);

    // Get duration
    ffmpeg.ffprobe(req.file.path, async (err, metadata) => {
      if (err) {
        console.error(`[Upload] FFprobe error for video ${video._id}:`, err);
      }
      if (!err) {
        console.log(
          `[Upload] FFprobe success for video ${video._id}. Duration: ${metadata.format.duration}`
        );
        video.duration = metadata.format.duration;
      }

      // Analyze sensitivity
      try {
        console.log(
          `[Upload] Calling analyzeSensitivity for video ${video._id}`
        );
        const sensitivity = await analyzeSensitivity(req.file.path);
        console.log(
          `[Upload] Sensitivity analysis completed for video ${video._id}. Result: ${sensitivity}`
        );

        video.sensitivity = sensitivity as any;
        video.status = "completed";
        await video.save();
        console.log(`[Upload] Video ${video._id} updated and saved.`);

        io.emit(`video-progress-${video._id}`, {
          progress: 100,
          status: "completed",
          sensitivity,
        });
      } catch (analysisErr) {
        console.error(
          `[Upload] Error during sensitivity analysis for video ${video._id}:`,
          analysisErr
        );
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all videos (accessible to user)
// @route   GET /api/videos
// @access  Private
export const getVideos = async (req: any, res: Response) => {
  try {
    // Find all orgs where user is owner or member
    const orgs = await Organization.find({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });

    const orgIds = orgs.map((org) => org._id);

    const videos = await Video.find({
      $or: [
        { organization: { $in: orgIds } },
        { user: req.user._id }, // Fallback for legacy
      ],
    })
      .sort({
        createdAt: -1,
      })
      .populate("organization", "name");

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private
export const deleteVideo = async (req: any, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    // Check permissions
    if (video.organization) {
      const org = await Organization.findById(video.organization);
      if (org) {
        const isOwner = org.owner.toString() === req.user._id.toString();
        const member = org.members.find(
          (m: any) => m.user.toString() === req.user._id.toString()
        );
        const isEditor = member && member.role === "editor";

        if (!isOwner && !isEditor) {
          res.status(403).json({ message: "Not authorized to delete" });
          return;
        }
      }
    } else {
      // Legacy check
      if (video.user.toString() !== req.user._id.toString()) {
        res.status(403).json({ message: "Not authorized" });
        return;
      }
    }

    // Delete file
    if (fs.existsSync(video.path)) {
      fs.unlinkSync(video.path);
    }

    await video.deleteOne();
    res.json({ message: "Video removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get video by ID
// @route   GET /api/videos/:id
// @access  Private
export const getVideoById = async (req: Request, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);
    if (video) {
      res.json(video);
    } else {
      res.status(404).json({ message: "Video not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Stream video
// @route   GET /api/videos/stream/:id
// @access  Private
export const streamVideo = async (req: Request, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    const videoPath = video.path;
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = (range as string).replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0] as string, 10);
      const end = parts[1] ? parseInt(parts[1] as string, 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
