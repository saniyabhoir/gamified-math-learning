// backend/routes/user.js
const express = require("express");
const { protect } = require("../middleware/auth"); // ✅ fixed import

const router = express.Router();

// Get logged-in user profile
router.get("/profile", protect, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;