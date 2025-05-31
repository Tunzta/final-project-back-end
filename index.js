const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const path = require("path");

const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const CommentRouter = require("./routes/CommentRouter");

// Kết nối MongoDB
dbConnect();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Cấu hình session
app.use(
  session({
    secret: "photoapp-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 60 * 1000, // 30 phút
      httpOnly: true
    },
  })
);

// Middleware kiểm tra login (trừ login/register)
app.use((req, res, next) => {
  if (
    req.path === "/api/admin/login" ||
    (req.path === "/api/user" && req.method === "POST") // đăng ký
  ) {
    return next();
  }
  if (!req.session.user_id) {
    return res.status(401).send("Unauthorized");
  }
  next();
});

// Static và router
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api", UserRouter);
app.use("/api/photosOfUser", PhotoRouter);
app.use("/api", CommentRouter);

app.get("/", (req, res) => {
  res.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
