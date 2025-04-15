require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const User = require("./models/User");
const Post = require("./models/Post");

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(
  cors({
    origin: "*", // During development
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Connect to MongoDB with better error handling
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB successfully!");
    console.log("Database: " + mongoose.connection.name);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error(
      "Please make sure MongoDB is running and your connection string is correct"
    );
    process.exit(1);
  });

// Register endpoint
app.post("/api/register", async (req, res) => {
  try {
    console.log("📝 Registration request received:", req.body);
    const { name, email, password } = req.body;

    // Skip password hashing for testing
    const user = new User({
      name,
      email,
      password: password, // Temporarily skip hashing for testing
    });

    console.log("💾 Saving user to database...");
    await user.save();
    console.log("✅ User saved successfully!");

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Registration error:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    console.log("Login attempt for:", req.body.email);
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // For testing, check if we're using hashed passwords or not
    let isMatch = false;

    // If the password is hashed (longer than normal password)
    if (user.password.length > 20) {
      // Compare with bcrypt
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Direct comparison for non-hashed passwords (temporary for testing)
      isMatch = password === user.password;
    }

    if (!isMatch) {
      console.log("Password mismatch for:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Return user data (except password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture || "default-profile.png",
      bio: user.bio || "",
    };

    console.log("Login successful for:", email);
    res.json(userData);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Profile update endpoint
app.put("/api/users/profile", async (req, res) => {
  try {
    const { userId, name, bio } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find user and update
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    // Return updated user data (except password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
    };

    res.json(userData);
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Improve the profile picture endpoint
app.post("/api/users/profile-picture", async (req, res) => {
  try {
    console.log("Profile picture update request received");
    const { userId, profilePictureUrl } = req.body;

    if (!userId) {
      console.log("Missing userId in request");
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!profilePictureUrl || typeof profilePictureUrl !== "string") {
      console.log("Invalid profilePictureUrl in request");
      return res
        .status(400)
        .json({ message: "Valid profile picture data is required" });
    }

    // Validate the data URL format
    if (!profilePictureUrl.startsWith("data:image/")) {
      console.log("Invalid image format");
      return res.status(400).json({ message: "Invalid image format" });
    }

    console.log("Looking up user with ID:", userId);
    // Find user
    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    try {
      // Update profile picture
      console.log("Updating profile picture for user:", user.name);
      user.profilePicture = profilePictureUrl;
      await user.save();
      console.log("Profile picture updated successfully");

      res.json({
        message: "Profile picture updated successfully",
        profilePicture: profilePictureUrl,
      });
    } catch (saveError) {
      console.error("Database save error:", saveError);

      // If the error is related to document size, suggest a more compressed image
      if (saveError.message && saveError.message.includes("document size")) {
        return res.status(413).json({
          message:
            "Image too large. Please use a smaller or more compressed image.",
        });
      } else {
        throw saveError; // Re-throw for the outer catch block
      }
    }
  } catch (error) {
    console.error("Profile picture update error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Update the post creation endpoint
app.post("/api/posts", async (req, res) => {
  try {
    console.log("Received post creation request");
    const { userId, text, image } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Validate inputs
    if (!text && !image) {
      console.log("Post must have text or image");
      return res.status(400).json({ message: "Post must have text or image" });
    }

    // Create post object
    const postData = {
      user: userId,
      text: text || "", // Use empty string if no text
    };

    // Only add image if it exists
    if (image) {
      // Validate image format (basic check)
      if (typeof image === "string" && image.startsWith("data:image/")) {
        postData.image = image;
      } else {
        console.log("Invalid image format");
        return res.status(400).json({ message: "Invalid image format" });
      }
    }

    // Create and save the post
    console.log("Creating new post");
    const newPost = new Post(postData);

    try {
      await newPost.save();
      console.log("Post saved successfully");

      // Populate user info
      await newPost.populate("user", ["name", "profilePicture"]);

      res.status(201).json(newPost);
    } catch (saveError) {
      console.error("Error saving post:", saveError);

      // Check for document size error
      if (saveError.message && saveError.message.includes("document size")) {
        return res.status(413).json({
          message:
            "Image too large. Please use a smaller or more compressed image.",
        });
      }

      throw saveError; // Re-throw for outer catch
    }
  } catch (error) {
    console.error("Post creation error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Get all posts
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ date: -1 })
      .populate("user", ["name", "profilePicture"]);

    res.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get posts by user ID
app.get("/api/posts/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .sort({ date: -1 })
      .populate("user", ["name", "profilePicture"]);

    res.json(posts);
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Like/unlike a post
app.post("/api/posts/:postId/like", async (req, res) => {
  try {
    const { userId, action } = req.body;
    const { postId } = req.params;

    // Check if post exists
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if post is already liked by user
    const isLiked = post.likes.some((like) => like.user.toString() === userId);

    if (action === "like" && !isLiked) {
      // Add like
      post.likes.unshift({ user: userId });
    } else if (action === "unlike" && isLiked) {
      // Remove like
      post.likes = post.likes.filter((like) => like.user.toString() !== userId);
    } else {
      return res.status(400).json({
        message:
          action === "like" ? "Post already liked" : "Post not liked yet",
      });
    }

    await post.save();

    res.json({
      message: action === "like" ? "Post liked" : "Post unliked",
      likes: post.likes.length,
    });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Comment on a post
app.post("/api/posts/:postId/comment", async (req, res) => {
  try {
    const { userId, text } = req.body;
    const { postId } = req.params;

    // Check if post exists
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add comment
    post.comments.unshift({
      user: userId,
      text,
    });

    await post.save();

    // Populate user info for the comments
    await post.populate("comments.user", ["name", "profilePicture"]);

    res.json(post.comments);
  } catch (error) {
    console.error("Comment post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a simple test endpoint
app.get("/api", (req, res) => {
  res.json({ message: "API is working" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
