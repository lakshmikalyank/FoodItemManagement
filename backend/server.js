require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authMiddleware = require("./middleware/auth");
const foodRoutes = require("./routes/foodRoutes");
const User = require("./models/User");
const Contact = require("./models/Contact");

const app = express(); // express application object

// ---------- CORS ----------
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow tools like Postman (no origin) and any origin if CLIENT_URL is empty
      if (!origin || allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

// ---------- Helpers ----------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// case-insensitive lookup so older accounts saved with capital letters still work
const findUserByEmail = (email) =>
  User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, "i") });

// ---------- Health ----------
app.get("/", (req, res) => {
  res.send("Backend server is running");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ---------- Auth ----------
app.post("/api/register", async (req, res) => {
  try {
    const fullname = String(req.body.fullname || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!fullname || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message: "Email already Registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(200).json({
      message: "Registration Successful",
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const remember = Boolean(req.body.remember);

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const existingUser = await findUserByEmail(email);

    if (!existingUser) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, existingUser.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: existingUser._id,
        email: existingUser.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: remember ? "7d" : "1d",
      }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: existingUser._id,
        fullname: existingUser.fullname,
        email: existingUser.email,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Login Failed",
      error: error.message,
    });
  }
});

// ---------- Profile ----------
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Failed to Fetch Profile",
      error: error.message,
    });
  }
});

app.put("/api/update-profile", authMiddleware, async (req, res) => {
  try {
    const fullname = String(req.body.fullname || "").trim();

    if (!fullname) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.fullname = fullname;

    await user.save();

    res.status(200).json({
      message: "Profile Updated Successfully",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to Update Profile",
      error: error.message,
    });
  }
});

app.put("/api/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // current password is verified when the client sends it
    if (currentPassword !== undefined) {
      const ok = await bcrypt.compare(String(currentPassword), user.password);
      if (!ok) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }
    }

    user.password = await bcrypt.hash(String(newPassword), 10);

    await user.save();

    res.status(200).json({
      message: "Password Changed Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to Change Password",
      error: error.message,
    });
  }
});

// ---------- Food items (protected, per-user) ----------
app.use("/api/items", foodRoutes);

// ---------- Contact form ----------
app.post("/api/contact", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const message = String(req.body.message || "").trim();

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    // attach the user if a valid token was sent (optional)
    let userId;
    try {
      const header = req.header("Authorization") || "";
      const token = header.replace("Bearer ", "");
      if (token) userId = jwt.verify(token, process.env.JWT_SECRET).id;
    } catch (e) {
      userId = undefined;
    }

    await Contact.create({ name, email, message, user: userId });

    res.status(201).json({
      message: "Thank you! Your message has been sent.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
});

// ---------- 404 + error handlers ----------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(err.message === "Not allowed by CORS" ? 403 : 500).json({
    message: err.message || "Server error",
  });
});

// ---------- Start ----------
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Add it to your .env file.");
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Cloud Connected Successfully");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB Connection Failed", error);
    process.exit(1);
  });
