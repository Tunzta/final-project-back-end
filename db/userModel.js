const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  login_name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  occupation: { type: String, required: true },
});

module.exports = mongoose.model.Users || mongoose.model("Users", userSchema);
