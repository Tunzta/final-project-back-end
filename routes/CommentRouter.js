const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");

router.post("/commentsOfPhoto/:photo_id", async (req, res) => {
  const { photo_id } = req.params;
  const { comment } = req.body;
  const userId = req.session.user_id;

  if (!comment || !comment.trim()) {
    return res.status(400).send("Comment cannot be empty");
  }

  try {
    const photo = await Photo.findById(photo_id);
    if (!photo) return res.status(404).send("Photo not found");

    const user = await User.findById(userId);
    if (!user) return res.status(401).send("User not found");

    const newComment = {
      comment: comment.trim(),
      date_time: new Date(),
      user_id: user._id,
      _id: new mongoose.Types.ObjectId(),
    };

    photo.comments = photo.comments || [];
    photo.comments.push(newComment);
    await photo.save();

    res.status(201).json(newComment); // Trả về trực tiếp object sẽ giữ đúng định dạng ObjectId và Date
  } catch (err) {
    console.error("Error in /commentsOfPhoto:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
