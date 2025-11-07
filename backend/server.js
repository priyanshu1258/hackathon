// server.js - Combined Server + Data Generator
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

// ✅ Load service account from env with error handling
let serviceAccount;
try {
  const serviceAccountPath = path.resolve(process.env.FIREBASE_KEY_PATH);
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error(
    "❌ Failed to load service account key. Check FIREBASE_KEY_PATH.",
    error
  );
  process.exit(1);
}

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL,
});

const db = admin.database();

// ==================== DATA GENERATION LOGIC ====================

// Buildings and categories
const buildings = ["Hostel-A", "Library", "Cafeteria", "Labs"];
const categories = ["electricity", "water", "food"];

// In-memory last values to make generated data smooth and realistic
const lastValues = {
  electricity: {},
  water: {},
  food: {},
};

// 🕒 Format HH:MM
function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

// 📊 Generate realistic, smoothed data per category/building (looks like real sensor data)
function generateReading(category, building, ts) {
  // Initialize last value if missing so first reading isn't extreme
  if (!lastValues[category][building]) {
    const initBase = (() => {
      if (category === "electricity") {
        // Realistic base loads for different buildings
        if (building.includes("Hostel")) return 115 + Math.random() * 10;
        if (building.includes("Cafeteria")) return 195 + Math.random() * 10;
        if (building.includes("Library")) return 75 + Math.random() * 10;
        return 80 + Math.random() * 5;
      }
      if (category === "water") {
        if (building.includes("Hostel")) return 2400 + Math.random() * 200;
        if (building.includes("Cafeteria")) return 3900 + Math.random() * 200;
        if (building.includes("Library")) return 580 + Math.random() * 40;
        return 600 + Math.random() * 50;
      }
      if (category === "food") {
        if (building.includes("Cafeteria")) return 28 + Math.random() * 4;
        if (building.includes("Hostel")) return 3.5 + Math.random() * 1;
        return 0.8 + Math.random() * 0.4;
      }
      return 1;
    })();
    lastValues[category][building] = initBase;
  }

  const date = new Date(ts);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const day = date.getDay(); // 0 (Sunday) to 6 (Saturday)
  const isWeekend = day === 0 || day === 6;
  
  let unit = "", value = lastValues[category][building], meta = {};

  if (category === "electricity") {
    unit = "kWh";
    
    // More realistic time-of-day patterns
    let timeFactor = 1.0;
    if (hour >= 6 && hour < 8) timeFactor = 0.85; // Early morning ramp-up
    else if (hour >= 8 && hour < 12) timeFactor = 1.1; // Morning peak
    else if (hour >= 12 && hour < 14) timeFactor = 1.2; // Lunch peak
    else if (hour >= 14 && hour < 17) timeFactor = 1.15; // Afternoon
    else if (hour >= 17 && hour < 21) timeFactor = 1.25; // Evening peak
    else if (hour >= 21 && hour < 23) timeFactor = 0.95; // Evening decline
    else timeFactor = 0.7; // Night
    
    const weekendFactor = isWeekend ? 0.85 : 1.0;
    
    // Building-specific characteristics
    const buildingBase = building.includes("Hostel") ? 118 : 
                        building.includes("Cafeteria") ? 205 : 
                        building.includes("Library") ? 78 : 82;
    
    // Add realistic variations (sensor noise, load changes)
    const microVariation = (Math.random() - 0.5) * 2; // Small jitter
    const noise = (Math.random() - 0.5) * buildingBase * 0.04; // ±4%
    
    const target = (buildingBase * timeFactor * weekendFactor) + noise + microVariation;
    
    // Smooth transition with momentum
    value = +(lastValues[category][building] * 0.80 + target * 0.20).toFixed(2);
  }

  if (category === "water") {
    unit = "L";
    
    // Realistic water usage patterns
    let timeFactor = 1.0;
    if (hour >= 6 && hour < 8) timeFactor = 1.3; // Morning peak (showers, toilets)
    else if (hour >= 8 && hour < 10) timeFactor = 1.15; // Post-morning
    else if (hour >= 10 && hour < 12) timeFactor = 0.95; // Mid-morning
    else if (hour >= 12 && hour < 14) timeFactor = 1.25; // Lunch peak
    else if (hour >= 14 && hour < 17) timeFactor = 0.9; // Afternoon lull
    else if (hour >= 17 && hour < 20) timeFactor = 1.2; // Evening peak
    else if (hour >= 20 && hour < 22) timeFactor = 0.85; // Evening decline
    else if (hour >= 22 || hour < 6) timeFactor = 0.55; // Night (minimal usage)
    
    const weekendFactor = isWeekend ? 0.75 : 1.0;
    
    const buildingBase = building.includes("Hostel") ? 2450 : 
                        building.includes("Cafeteria") ? 3950 : 
                        building.includes("Library") ? 590 : 610;
    
    // Water usage has more variation than electricity
    const microVariation = (Math.random() - 0.5) * 50;
    const noise = (Math.random() - 0.5) * buildingBase * 0.06;
    
    const target = Math.round((buildingBase * timeFactor * weekendFactor) + noise + microVariation);
    value = Math.round(lastValues[category][building] * 0.82 + target * 0.18);
  }

  if (category === "food") {
    unit = "kg";
    
    if (building.includes("Cafeteria")) {
      // Realistic meal service patterns
      let medianMeals = 0;
      if (hour >= 6 && hour < 10) medianMeals = 185; // Breakfast
      else if (hour >= 10 && hour < 12) medianMeals = 95; // Post-breakfast
      else if (hour >= 12 && hour < 15) medianMeals = 420; // Lunch peak
      else if (hour >= 15 && hour < 18) medianMeals = 110; // Snacks
      else if (hour >= 18 && hour < 22) medianMeals = 310; // Dinner
      else medianMeals = 45; // Off-peak

      const weekendFactor = isWeekend ? 0.65 : 1.0;
      const hourVariation = (Math.random() - 0.5) * 0.15; // ±15% variation
      
      const mealsServed = Math.max(10, Math.round(medianMeals * weekendFactor * (1 + hourVariation)));
      
      // Waste per meal varies realistically
      const baseWastePerMeal = 0.055; // Average 55g per meal
      const wasteVariation = (Math.random() - 0.5) * 0.025; // ±25g
      const perMealWaste = +(baseWastePerMeal + wasteVariation).toFixed(4);
      
      const target = +(mealsServed * perMealWaste).toFixed(2);
      value = +(lastValues[category][building] * 0.75 + target * 0.25).toFixed(2);
      meta = { mealsServed };
      
    } else if (building.includes("Hostel")) {
      // Hostel food waste - minimal, varies by day
      const base = 3.2;
      const timeVariation = hour >= 18 && hour < 22 ? 1.2 : 0.9; // Higher in evening
      const noise = (Math.random() - 0.5) * base * 0.35;
      const target = +(base * timeVariation + noise).toFixed(2);
      value = +(lastValues[category][building] * 0.80 + target * 0.20).toFixed(2);
      
    } else {
      // Labs/other buildings - very minimal food waste
      const base = 0.65;
      const noise = (Math.random() - 0.5) * base * 0.6;
      const target = Math.max(0.1, +(base + noise).toFixed(2));
      value = +(lastValues[category][building] * 0.82 + target * 0.18).toFixed(2);
    }
  }

  // More lenient threshold for realistic data flow
  const delta = Math.abs(value - lastValues[category][building]);
  const threshold = 0.01 * lastValues[category][building]; // Very small threshold (1%)
  
  // Always update the value to ensure all buildings get fresh data
  lastValues[category][building] = value;
  
  // Return data even for small changes to ensure consistent updates for all buildings
  if (delta < threshold && Math.random() > 0.5) {
    // 50% chance to push even tiny changes - keeps all buildings active
    return { building, ts, time: formatTime(ts), value, unit, meta };
  }

  return { building, ts, time: formatTime(ts), value, unit, meta };
}

// 🧩 Push reading to Firebase with error handling and better logging
async function pushReading(category, building, record) {
  try {
    const ref = db.ref(`readings/${category}/${building}`);
    await ref.push(record);

    // Update latest snapshot
    await db.ref(`latest/${category}/${building}`).set({
      ts: record.ts,
      time: record.time,
      value: record.value,
      unit: record.unit,
    });

    // Compact output showing all buildings
    const metaInfo = record.meta?.mealsServed ? ` (${record.meta.mealsServed} meals)` : '';
    console.log(`    ${building.padEnd(12)} → ${String(record.value).padStart(7)} ${record.unit}${metaInfo}`);
  } catch (error) {
    console.error(`    ❌ ${building.padEnd(12)} → Error: ${error.message}`);
  }
}

// 🌀 Simulate realistic sensor data with improved logging
async function simulate() {
  const ts = Date.now();
  const batch = [];
  const currentTime = formatTime(ts);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🔄 Data Generation Cycle @ ${currentTime}`);
  console.log(`${'─'.repeat(60)}`);

  // Generate data for ALL buildings in ALL categories
  for (const category of categories) {
    for (const building of buildings) {
      const record = generateReading(category, building, ts);
      if (record) {
        batch.push({ category, building, record });
      }
    }
  }

  // This should always have data now
  console.log(`📊 Generated ${batch.length} readings (${categories.length} categories × ${buildings.length} buildings = ${categories.length * buildings.length} total)`);

  if (batch.length === 0) {
    console.warn(`⚠️  WARNING: No data generated - check threshold settings!`);
    console.log(`${'─'.repeat(60)}\n`);
    return;
  }

  console.log(`� Pushing to Firebase...`);

  // Group by category for better visual organization
  const groupedBatch = {};
  categories.forEach(cat => groupedBatch[cat] = []);
  batch.forEach(item => groupedBatch[item.category].push(item));

  // Batch write to Firebase with organized output
  let successCount = 0;
  for (const category of categories) {
    const items = groupedBatch[category];
    if (items.length > 0) {
      const emoji = category === 'electricity' ? '⚡' : category === 'water' ? '💧' : '🍽️';
      console.log(`\n  ${emoji} ${category.toUpperCase()}:`);
      for (const { building, record } of items) {
        await pushReading(category, building, record);
        successCount++;
      }
    }
  }

  console.log(`\n✅ Successfully stored ${successCount}/${batch.length} readings`);
  console.log(`${'─'.repeat(60)}\n`);
}

// ==================== SERVER & API LOGIC ====================

// ✅ Socket.IO setup with improved configuration
const io = new Server(server, {
  cors: {
    origin: "*", // For development - restrict in production
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Track active listeners to prevent memory leaks
const activeListeners = new Map();

// 🔌 Socket.IO connection with enhanced error handling
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id} | Total clients: ${io.engine.clientsCount}`);

  // Send current latest data immediately upon connection
  db.ref("latest").once("value")
    .then((snapshot) => {
      socket.emit("initialData", snapshot.val());
      console.log(`📤 Sent initial data to ${socket.id}`);
    })
    .catch((err) => console.error(`❌ Error sending initial data to ${socket.id}:`, err));

  // Listen for new readings and broadcast to this specific client
  const latestRef = db.ref("latest");
  const listener = (snapshot) => {
    const category = snapshot.key;
    const data = snapshot.val();
    
    // Broadcast to all connected clients
    io.emit("dataUpdate", {
      category,
      data,
      timestamp: Date.now()
    });
  };

  latestRef.on("child_changed", listener);
  activeListeners.set(socket.id, { ref: latestRef, listener });

  // Handle errors
  socket.on("error", (error) => {
    console.error(`❌ Socket error from ${socket.id}:`, error);
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} | Reason: ${reason} | Remaining: ${io.engine.clientsCount}`);
    
    // Clean up listener to prevent memory leaks
    const listenerInfo = activeListeners.get(socket.id);
    if (listenerInfo) {
      listenerInfo.ref.off("child_changed", listenerInfo.listener);
      activeListeners.delete(socket.id);
    }
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
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled (WebSocket + Polling)`);
  console.log(`🔥 Firebase connected to: ${process.env.FIREBASE_DB_URL}`);
  console.log(`${'='.repeat(60)}\n`);
});

// 🔥 Test Firebase connection and start data generation
db.ref("/test")
  .set({ message: "Server connected ✅", ts: Date.now() })
  .then(() => {
    console.log("✅ Firebase connection test successful\n");

    // Start data generation every 30 minutes (production interval)
    const interval = 10 * 60 * 1000; // 10 minutes for production
    // const interval = 5 * 60 * 1000; // uncomment for development (5 minutes)

    console.log(`🚀 Data generator started (interval: ${interval / 1000}s)`);
    console.log(`📍 Monitoring buildings: ${buildings.join(', ')}`);
    console.log(`📂 Categories: ${categories.join(', ')}`);
    console.log(`⏱️  Simulating real-time sensor data every 30 minutes\n`);
    
    simulate(); // run immediately
    setInterval(simulate, interval);
  })
  .catch((err) => {
    console.error("❌ Firebase connection test failed:", err);
    process.exit(1);
  });
