// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
const server = http.createServer(app);

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Load service account from env
const serviceAccountPath = path.resolve(process.env.FIREBASE_KEY_PATH);
const serviceAccount = require(serviceAccountPath);

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL,
});

const db = admin.database();

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*", // For development - restrict in production
    methods: ["GET", "POST"],
  },
});

// 🔌 Socket.IO connection
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  // Listen for new readings and broadcast to all clients
  const categoriesRef = db.ref("readings");
  categoriesRef.on("child_changed", (snapshot) => {
    socket.emit("dataUpdate", {
      category: snapshot.key,
      data: snapshot.val(),
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// 📊 API Routes

// Get all latest readings
app.get("/api/latest", async (req, res) => {
  try {
    const snapshot = await db.ref("latest").once("value");
    res.json(snapshot.val() || {});
  } catch (error) {
    console.error("Error fetching latest data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Get latest readings by category
app.get("/api/latest/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const snapshot = await db.ref(`latest/${category}`).once("value");
    res.json(snapshot.val() || {});
  } catch (error) {
    console.error("Error fetching category data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Get historical readings
app.get("/api/readings/:category/:building", async (req, res) => {
  try {
    const { category, building } = req.params;
    const { limit = 50 } = req.query;

    const snapshot = await db
      .ref(`readings/${category}/${building}`)
      .limitToLast(parseInt(limit))
      .once("value");

    const data = [];
    snapshot.forEach((child) => {
      data.push({ id: child.key, ...child.val() });
    });

    res.json(data);
  } catch (error) {
    console.error("Error fetching readings:", error);
    res.status(500).json({ error: "Failed to fetch readings" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Hackathon Backend API",
    endpoints: {
      latest: "/api/latest",
      latestByCategory: "/api/latest/:category",
      readings: "/api/readings/:category/:building?limit=50",
      health: "/api/health",
    },
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled`);
  console.log(`🔥 Firebase connected to: ${process.env.FIREBASE_DB_URL}`);
});

// 🔥 Test Firebase connection
db.ref("/test")
  .set({ message: "Server connected ✅", ts: Date.now() })
  .then(() => console.log("✅ Firebase connection test successful"))
  .catch((err) => console.error("❌ Firebase connection test failed:", err));
