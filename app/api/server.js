const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Mongo URL komt later uit de Kubernetes env var
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/ssdb";

app.use(cors());
app.use(express.json());

// Eenvoudig schema met één key/value document voor de naam
const NameSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: String
});

const NameModel = mongoose.model("Name", NameSchema);

// Mongo connectie + default naam "Stan Smeyers"
async function initMongo() {
  await mongoose.connect(mongoUrl, {});
  console.log("Connected to Mongo:", mongoUrl);

  const existing = await NameModel.findOne({ key: "username" });
  if (!existing) {
    await NameModel.create({ key: "username", value: "Stan Smeyers" });
    console.log("Inserted default name 'Stan Smeyers'");
  }
}

// GET /api/name → naam uit DB
app.get("/api/name", async (req, res) => {
  try {
    const doc = await NameModel.findOne({ key: "username" });
    if (!doc) {
      return res.status(404).json({ error: "Name not found" });
    }
    res.json({ name: doc.value });
  } catch (err) {
    console.error("Error getting name:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/name { name: "..." } → naam updaten
app.post("/api/name", async (req, res) => {
  try {
    const newName = req.body.name;
    if (!newName) {
      return res.status(400).json({ error: "Missing 'name' in body" });
    }

    const doc = await NameModel.findOneAndUpdate(
      { key: "username" },
      { value: newName },
      { new: true, upsert: true }
    );
    res.json({ name: doc.value });
  } catch (err) {
    console.error("Error updating name:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/container → container ID (hostname)
app.get("/api/container", (req, res) => {
  const containerId = process.env.HOSTNAME || "unknown";
  res.json({ containerId });
});

// Health endpoint voor liveness/readiness probes
app.get("/health", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    return res.status(200).send("OK");
  }
  return res.status(500).send("Mongo not connected");
});

initMongo()
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on port ${port}`);
    });
  })
  .catch(err => {
    console.error("Failed to init:", err);
    process.exit(1);
  });
