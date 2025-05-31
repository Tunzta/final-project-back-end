const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer lưu file tạm, tên file sẽ đổi sau
const upload = multer({ dest: path.join(__dirname, "../images") });

router.get("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(400).json({ error: "User not found" });
    }

    const photos = await Photo.find({ user_id: userId }).lean().exec();

    const processedPhotos = await Promise.all(
      photos.map(async (photo) => {
        const enrichedComments = await Promise.all(
          (photo.comments || []).map(async (comment) => {
            const commenter = await User.findById(
              comment.user_id,
              "_id first_name last_name"
            )
              .lean()
              .exec();

            return {
              _id: comment._id,
              comment: comment.comment,
              date_time: comment.date_time,
              user: commenter
                ? {
                    _id: commenter._id,
                    first_name: commenter.first_name,
                    last_name: commenter.last_name,
                  }
                : null,
            };
          })
        );

        return {
          _id: photo._id,
          user_id: photo.user_id,
          file_name: photo.file_name,
          date_time: photo.date_time,
          comments: enrichedComments,
        };
      })
    );

    res.status(200).json(processedPhotos);
  } catch (err) {
    console.error("Error in /photosOfUser/:id:", err);
    res.status(400).json({ error: "Invalid user ID or internal server error" });
  }
});

// Route upload ảnh mới cho user: POST /photos/new
router.post("/photos/new", upload.single("photo"), async (req, res) => {
  try {
    // Lấy userId từ JWT (req.user do authenticateJWT gắn vào)
    const userId = req.user && req.user._id;
    console.log("JWT user_id:", userId);

    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(400).json({ error: "User not found" });

    const photoCount = await Photo.countDocuments({ user_id: userId });
    const ext = path.extname(req.file.originalname) || ".jpg";
    const fileName = `${user.last_name.toLowerCase()}${photoCount + 1}${ext}`;
    const imagesDir = path.join(__dirname, "../images");
    const newPath = path.join(imagesDir, fileName);

    fs.renameSync(req.file.path, newPath);
    console.log("File renamed successfully to", fileName);

    const newPhoto = new Photo({
      file_name: fileName,
      user_id: user._id,
      date_time: new Date(),
      comments: [],
    });

    try {
      await newPhoto.save();
      console.log("Photo saved to MongoDB:", newPhoto);
      res.status(201).json({ message: "Photo uploaded successfully", photo: newPhoto });
    } catch (saveErr) {
      console.error("Error saving to MongoDB:", saveErr.message);
      return res.status(500).json({ error: "Error saving photo to database", detail: saveErr.message });
    }
  } catch (err) {
    console.error("Error uploading photo:", err);
    res.status(500).json({ error: "Unexpected error during upload", detail: err.message });
  }
});

module.exports = router;
