const express = require("express");
const router = express.Router();
const Photo = require("../db/photoModel");
const User = require("../db/userModel");

router.get("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(400).json({ error: "User not found" });
    }

    const photos = await Photo.find({ user_id: userId }).lean().exec();

    const processedPhotos = await Promise.all(photos.map(async (photo) => {
      const enrichedComments = await Promise.all((photo.comments || []).map(async (comment) => {
        const commenter = await User.findById(comment.user_id, "_id first_name last_name").lean().exec();

        return {
          _id: comment._id,
          comment: comment.comment,
          date_time: comment.date_time,
          user: commenter ? {
            _id: commenter._id,
            first_name: commenter.first_name,
            last_name: commenter.last_name
          } : null
        };
      }));

      return {
        _id: photo._id,
        user_id: photo.user_id,
        file_name: photo.file_name,
        date_time: photo.date_time,
        comments: enrichedComments
      };
    }));

    res.status(200).json(processedPhotos);
  } catch (err) {
    console.error("Error in /photosOfUser/:id:", err);
    res.status(400).json({ error: "Invalid user ID or internal server error" });
  }
});

module.exports = router;
