require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
let isDatabaseReady = false;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

function requireDatabase(req, res, next) {
  if (!isDatabaseReady) {
    return res.status(503).json({
      message: "Service temporarily unavailable. Database connection is not ready."
    });
  }

  return next();
}

app.post("/api/register", requireDatabase, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({
      $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }]
    });

    if (existingUser) {
      return res.status(409).json({ message: "Username or email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword
    });

    return res.status(201).json({ message: "Registration successful." });
  } catch (error) {
    return res.status(500).json({ message: "Server error during registration." });
  }
});

app.post("/api/login", requireDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Account not found. Please register first." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.status(200).json({
      message: `Welcome back, ${user.username}!`,
      username: user.username
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error during login." });
  }
});

app.get("/welcome/:username", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "welcome.html"));
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok", database: isDatabaseReady ? "connected" : "disconnected" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function connectToMongoDB() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Auth endpoints will return 503 until a DB URI is provided.");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    isDatabaseReady = true;
    console.log("Connected to MongoDB.");
  } catch (error) {
    isDatabaseReady = false;
    console.error("Failed to connect to MongoDB:", error.message);
  }
}

async function startServer() {
  const port = Number(process.env.PORT) || 8080;

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  mongoose.connection.on("disconnected", () => {
    isDatabaseReady = false;
  });

  mongoose.connection.on("connected", () => {
    isDatabaseReady = true;
  });

  mongoose.connection.on("error", () => {
    isDatabaseReady = false;
  });

  await connectToMongoDB();
}

startServer();
