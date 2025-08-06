const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming you have a User model defined
const otplib = require('otplib');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');

// Route: Save/Update User Profile + Generate TOTP Secret and QR Code
router.post('/profile', async (req, res) => {
  try {
    const {
      email, firstName, lastName, phone,
      village, ageRange, educationLevel,
      occupation, experienceLevel
    } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email });
    }

    // Update user profile info
    Object.assign(user, {
      firstName, lastName, phone, village,
      ageRange, educationLevel, occupation,
      experienceLevel
    });

    // Generate TOTP secret if not already set
    if (!user.totpSecret) {
      user.totpSecret = otplib.authenticator.generateSecret();
    }

    await user.save();

    // Generate otpauth URL for QR code
    const otpauth = otplib.authenticator.keyuri(email, 'DigiBridge', user.totpSecret);
    const qrCodeDataURL = await qrcode.toDataURL(otpauth);

    res.json({ message: 'Profile saved', qrCodeDataURL });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



// Route: Verify TOTP Code (2FA Verification)
router.post('/verify', async (req, res) => {
  try {
    const { email, token } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isValid = otplib.authenticator.verify({ token, secret: user.totpSecret });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid authentication code' });
    }

    user.twoFactorEnabled = true;
    await user.save();

    // Create a JWT token for session/auth
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: '2FA verified', token: jwtToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
