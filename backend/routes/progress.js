// backend/routes/progress.js
const express = require("express");
const Progress = require("../models/Progress");
const { protect } = require("../middleware/auth"); // ✅ FIXED

const router = express.Router();

// GET progress
router.get("/", protect, async (req, res) => {
  try {
    let progress = await Progress.findOne({ student: req.user._id });

    if (!progress) {
      progress = await Progress.create({
        student: req.user._id,
        modules: [],
      });
    }

    res.json({ success: true, data: progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADD / UPDATE module progress
router.post("/module", protect, async (req, res) => {
  try {
    const {
      moduleId,
      moduleOrder,
      title,
      completed,
      score,
      attempts,
      timeSpent,
      weakTopics,
    } = req.body;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: "moduleId is required",
      });
    }

    let progress = await Progress.findOne({ student: req.user._id });

    if (!progress) {
      progress = new Progress({
        student: req.user._id,
        modules: [],
      });
    }

    const idx = progress.modules.findIndex(
      (m) => m.moduleId === moduleId
    );

    const update = {
      moduleId,
      moduleOrder: moduleOrder ?? 1,
      title: title ?? "",
      completed: completed ?? false,
      score: score ?? 0,
      attempts: attempts ?? 1,
      timeSpent: timeSpent ?? 0,
      weakTopics: weakTopics ?? [],
      lastAttemptAt: new Date(),
    };

    if (idx === -1) {
      progress.modules.push(update);
    } else {
      progress.modules[idx] = {
        ...progress.modules[idx].toObject(),
        ...update,
        score: Math.max(progress.modules[idx].score, score ?? 0),
        attempts: (progress.modules[idx].attempts || 0) + 1,
        timeSpent:
          (progress.modules[idx].timeSpent || 0) + (timeSpent ?? 0),
      };
    }

    progress.totalTimeSpent = progress.modules.reduce(
      (s, m) => s + (m.timeSpent || 0),
      0
    );

    progress.lastActiveAt = new Date();

    await progress.save();

    res.json({ success: true, data: progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;