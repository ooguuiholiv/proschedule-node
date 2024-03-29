const mongoose = require('mongoose')

const PasswordResetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  resetTokenExpiry: {type: Date, required: true},
  createdAt: { type: Date, default: Date.now,  },
});

const PasswordReset = mongoose.model("PasswordReset", PasswordResetSchema);

module.exports = PasswordReset