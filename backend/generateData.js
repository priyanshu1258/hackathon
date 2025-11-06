// generateData.js
require("dotenv").config();
const admin = require("firebase-admin");
const path = require("path");

// ✅ Load service account from env
const serviceAccountPath = path.resolve(process.env.FIREBASE_KEY_PATH);
const serviceAccount = require(serviceAccountPath);

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();

// Buildings and categories
const buildings = ["Hostel-A", "Library", "Cafeteria", "Labs"];
const categories = ["electricity", "water", "food"];

// 🕒 Format HH:MM
function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

// 📊 Generate fake data per category/building
function generateReading(category, building, ts) {
  let base, unit, value, meta = {};

  switch (category) {
    case "electricity":
      base = building.includes("Hostel") ? 120 : building.includes("Cafeteria") ? 200 : 80;
      value = +(base + (Math.random() - 0.5) * base * 0.3).toFixed(2);
      unit = "kWh";
      break;

    case "water":
      base = building.includes("Hostel") ? 2500 : building.includes("Cafeteria") ? 4000 : 600;
      value = Math.round(base + (Math.random() - 0.5) * base * 0.25);
      unit = "L";
      break;

    case "food":
      base = building.includes("Cafeteria") ? 10 : building.includes("Hostel") ? 2 : 0.5;
      value = +(base + (Math.random() - 0.5) * base * 0.8).toFixed(2);
      unit = "kg";
      meta = building.includes("Cafeteria")
        ? { mealsServed: Math.round(100 + Math.random() * 200) }
        : {};
      break;
  }

  return { building, ts, time: formatTime(ts), value, unit, meta };
}

// 🧩 Push reading to Firebase
async function pushReading(category, building, record) {
  const ref = db.ref(`readings/${category}/${building}`);
  await ref.push(record);

  // Update latest snapshot
  await db.ref(`latest/${category}/${building}`).set({
    ts: record.ts,
    time: record.time,
    value: record.value,
    unit: record.unit,
  });

  console.log(`✅ Added ${category}/${building}`, record);
}

// 🌀 Simulate fake data
async function simulate() {
  const ts = Date.now();
  for (const category of categories) {
    for (const building of buildings) {
      const record = generateReading(category, building, ts);
      await pushReading(category, building, record);
    }
  }
}

// 🔌 Test Firebase connection
db.ref("/test")
  .set({ message: "Firebase connected ✅", ts: Date.now() })
  .then(() => console.log("Firebase connection test successful"))
  .catch((err) => console.error("Firebase connection test failed:", err));

// 🔁 Run simulation
const interval = 10 * 60 * 1000; // 10 minutes
// const interval = 30 * 60 * 1000; // uncomment for production (30 minutes)

console.log("🚀 Fake data generator started...");
simulate(); // run immediately
setInterval(simulate, interval);
