const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, (req, res) => {
  // This runs only if token is valid
  res.json({ message: 'Welcome to your dashboard!', userEmail: req.user.email });
});

module.exports = router;
