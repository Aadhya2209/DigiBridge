const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  phone: String,
  firstName: String,
  lastName: String,
  village: String,
  ageRange: String,
  educationLevel: String,
  occupation: String,
  experienceLevel: String,
  totpSecret: String, // For 2FA, will be stored (ideally encrypted)
  twoFactorEnabled: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', UserSchema);
