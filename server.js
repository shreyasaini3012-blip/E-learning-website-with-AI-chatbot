const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 2025; // Changed port to 2025

// Middleware
app.use(express.static(path.join(__dirname, "Public"))); // Serve static files
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.json()); // Parse JSON body
app.use(cors()); // Enable cross-origin requests

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/userdb")
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Define schemas and models
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isLoggedIn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
const Contact = mongoose.model("Contact", ContactSchema);

// Serve Login Page
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "Public", "views", "login.html"));
});

// User Registration with Password Hashing
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });

    await newUser.save();
    console.log("✅ Registered User:", newUser);
    res.send("User Registered Successfully");
  } catch (error) {
    console.error("❌ Registration Error:", error.message || error);
    res.status(500).send("Internal Server Error");
  }
});

// User Login with Password Verification
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send("Invalid email or password");
    }

    user.isLoggedIn = true;
    await user.save();
    console.log("✅ Logged In User:", user);

    res.sendFile(path.join(__dirname, "Public", "views", "index.html"));
  } catch (error) {
    console.error("❌ Login Error:", error.message || error);
    res.status(500).send("Internal Server Error");
  }
});

// Serve Contact Us Page
app.get("/contact", (_req, res) => {
  res.sendFile(path.join(__dirname, "Public", "views", "contact.html"));
});

// Handle Contact Form Submission
app.post("/submit-contact", async (req, res) => {
  try {
    console.log("📩 Received Contact Data:", req.body);

    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).send("All fields are required");
    }

    const newContact = new Contact({ name, email, message });
    await newContact.save();

    console.log("✅ Contact Form Submission:", newContact);
    res.status(200).send("Contact message saved successfully");
  } catch (error) {
    console.error("❌ Contact Form Error:", error.message || error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
