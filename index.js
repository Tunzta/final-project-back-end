const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");

const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const CommentRouter = require("./routes/CommentRouter");
const authenticateJWT = require("./middleware/authenticateJWT"); // <-- import middleware

// Kết nối MongoDB
dbConnect();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Static và router
app.use("/images", express.static(path.join(__dirname, "images")));

// Áp dụng authenticateJWT cho các route cần bảo vệ
app.use("/api/photosOfUser", authenticateJWT, PhotoRouter);
app.use("/api", UserRouter);
app.use("/api", authenticateJWT, CommentRouter);

app.get("/", (req, res) => {
  res.send({ message: "Hello from photo-sharing app API!" });
});

// Middleware bắt lỗi toàn cục
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
