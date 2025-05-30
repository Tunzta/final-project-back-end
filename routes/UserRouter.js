const express = require("express");
const router = express.Router();
const User = require("../db/userModel");

// Đăng ký tài khoản mới (POST /api/user)
router.post("/user", async (req, res) => {
  const {
    login_name,
    password,
    first_name,
    last_name,
    location,
    description,
    occupation,
  } = req.body;

  if (!login_name || !password || !first_name || !last_name) {
    return res.status(400).send("Required fields missing");
  }

  try {
    const existing = await User.findOne({ login_name });
    if (existing) return res.status(400).send("Login name already exists");

    const newUser = new User({
      login_name,
      password,
      first_name,
      last_name,
      location,
      description,
      occupation,
    });

    await newUser.save();
    res.send({ login_name: newUser.login_name });
  } catch (err) {
    res.status(500).send("Registration failed");
  }
});

// Login (POST /api/admin/login)
router.post("/admin/login", async (req, res) => {
  const { login_name, password } = req.body;
  if (!login_name || !password)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const user = await User.findOne({ login_name });
    if (!user || user.password !== password)
      return res.status(401).json({ error: "Invalid credentials" });

    // Lưu user_id vào session
    req.session.user_id = user._id;

    const {
      _id,
      first_name,
      last_name,
      location,
      description,
      occupation,
      login_name: name,
    } = user;
    res.status(200).json({
      _id,
      login_name: name,
      first_name,
      last_name,
      location,
      description,
      occupation,
    });
  } catch (err) {
    res.status(500).json({ error: "Login error" });
  }
});

// Logout (POST /api/admin/logout)
router.post("/admin/logout", (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).json({ error: "Not logged in" });
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.status(200).json({ message: "Logout successful" });
    res.redirect("/");
  });
});

// Danh sách người dùng (GET /api/user/list)
router.get("/user/list", async (req, res) => {
  try {
    const users = await User.find({}, "_id first_name last_name").exec();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user list" });
  }
});

// Chi tiết người dùng theo ID (GET /api/user/:id)
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).exec();
    if (!user) return res.status(400).json({ error: "User not found" });

    const {
      _id,
      first_name,
      last_name,
      location,
      description,
      occupation,
    } = user;
    res
      .status(200)
      .json({
        _id,
        first_name,
        last_name,
        location,
        description,
        occupation,
      });
  } catch (err) {
    res.status(400).json({ error: "Invalid user ID" });
  }
});

// Thông tin người dùng hiện tại (GET /api/me)
router.get("/me", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  User.findById(req.session.user_id, "-password")
    .then((user) => {
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    })
    .catch(() => res.status(500).json({ error: "Server error" }));
});

module.exports = router;
