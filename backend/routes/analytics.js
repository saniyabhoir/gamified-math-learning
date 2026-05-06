// backend/routes/analytics.js
const express = require("express");
const User = require("../models/User");
const Progress = require("../models/Progress");
const { protect, restrictTo } = require("../middleware/auth"); // ✅ FIXED

const router = express.Router();

const avg = (arr) =>
  arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

/* ---------------- OVERVIEW ---------------- */
router.get("/overview", protect, restrictTo("teacher"), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const allProgress = await Progress.find().lean();

    const allScores = allProgress.flatMap((p) =>
      p.modules
        .filter((m) => m.completed)
        .map((m) => m.score)
    );

    const averageScore = Math.round(avg(allScores));

    const totalCompleted = allProgress.reduce(
      (s, p) => s + p.modules.filter((m) => m.completed).length,
      0
    );

    const modulesCompleted =
      totalStudents > 0
        ? Math.round((totalCompleted / (totalStudents * 5)) * 100)
        : 0;

    const avgTimeSpent = Math.round(
      avg(allProgress.map((p) => p.totalTimeSpent || 0))
    );

    res.json({
      success: true,
      data: {
        totalStudents,
        averageScore,
        modulesCompleted,
        avgTimeSpent,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------- STUDENTS ---------------- */
router.get("/students", protect, restrictTo("teacher"), async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("name email")
      .lean();

    const progressDocs = await Progress.find().lean();

    const progressMap = {};
    for (const p of progressDocs) {
      progressMap[p.student.toString()] = p;
    }

    const data = students.map((s) => {
      const p = progressMap[s._id.toString()];

      if (!p) {
        return {
          _id: s._id,
          name: s.name,
          email: s.email,
          modulesCompleted: 0,
          averageScore: 0,
          timeSpent: 0,
          weakTopic: null,
          activeThisWeek: false,
        };
      }

      const completed = p.modules.filter((m) => m.completed);

      const averageScore = Math.round(avg(completed.map((m) => m.score)));

      const weak =
        completed.length
          ? completed.reduce((mn, m) => (m.score < mn.score ? m : mn))
          : null;

      const weakTopic =
        weak && weak.score < 60
          ? weak.weakTopics?.[0] || weak.title || null
          : null;

      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        modulesCompleted: completed.length,
        averageScore,
        timeSpent: Math.round(p.totalTimeSpent || 0),
        weakTopic,
        activeThisWeek: p.activeThisWeek || false,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------- MODULES ---------------- */
router.get("/modules", protect, restrictTo("teacher"), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const allProgress = await Progress.find().lean();

    const moduleMap = {};

    for (const p of allProgress) {
      for (const m of p.modules) {
        if (!moduleMap[m.moduleId]) {
          moduleMap[m.moduleId] = {
            moduleId: m.moduleId,
            moduleOrder: m.moduleOrder,
            title: m.title,
            scores: [],
            attempts: [],
            completedCount: 0,
          };
        }

        moduleMap[m.moduleId].scores.push(m.score);
        moduleMap[m.moduleId].attempts.push(m.attempts || 1);

        if (m.completed) moduleMap[m.moduleId].completedCount++;

        if (m.title) moduleMap[m.moduleId].title = m.title;
      }
    }

    const data = Object.values(moduleMap)
      .sort((a, b) => a.moduleOrder - b.moduleOrder)
      .map((m) => ({
        moduleId: m.moduleId,
        moduleOrder: m.moduleOrder,
        title: m.title,
        enrolledStudents: totalStudents,
        completionRate:
          totalStudents > 0
            ? (m.completedCount / totalStudents) * 100
            : 0,
        avgScore: avg(m.scores),
        avgAttempts: avg(m.attempts),
      }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------- WEAK TOPICS ---------------- */
router.get("/weak-topics", protect, restrictTo("teacher"), async (req, res) => {
  try {
    const allProgress = await Progress.find().lean();

    const topicCount = {};

    for (const p of allProgress) {
      for (const m of p.modules) {
        for (const t of m.weakTopics || []) {
          topicCount[t] = (topicCount[t] || 0) + 1;
        }
      }
    }

    const data = Object.entries(topicCount)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;