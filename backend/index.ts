import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./src/config/db";
import path from "path";

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io accessible in routes
app.set("io", io);

import authRoutes from "./src/routes/authRoutes";
import videoRoutes from "./src/routes/videoRoutes";
import orgRoutes from "./src/routes/orgRoutes";

// Routes Placeholder
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/orgs", orgRoutes);
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
