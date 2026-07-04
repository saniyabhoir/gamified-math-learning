const express = require("express");
const User = require("../models/User");
const Progress = require("../models/Progress");

const { protect } = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

const avg = (arr) =>
  arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

/* ---------------- OVERVIEW ---------------- */
router.get("/overview", protect, roleMiddleware("teacher"), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const allProgress = await Progress.find().lean();

    const completedModules = allProgress.flatMap((p) =>
      (p.modules || []).filter((m) => m.completed)
    );

    const allScores = completedModules.map((m) => m.score || 0);
    const totalCompleted = completedModules.length;

    res.json({
      success: true,
      data: {
        totalStudents,
        averageScore: Math.round(avg(allScores)),
        totalCompleted,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ---------------- STUDENTS ---------------- */
router.get("/students", protect, roleMiddleware("teacher"), async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("_id name username email")
      .lean();

    const data = await Promise.all(
      students.map(async (student) => {
        const progress = await Progress.findOne({
          studentId: student._id,
        }).lean();

        const modules = progress?.modules || [];
        const completedModules = modules.filter((m) => m.completed);

        return {
          _id: student._id,
          name: student.name || student.username || "Student",
          email: student.email || "",
          modulesCompleted: progress?.modulesCompleted || completedModules.length || 0,
          averageScore:
            progress?.averageScore ||
            Math.round(avg(completedModules.map((m) => m.score || 0))),
          overallAccuracy: progress?.overallAccuracy || 0,
          totalTimeSpent: progress?.totalTimeSpent || 0,
          totalRewardPoints: progress?.totalRewardPoints || 0,
          weakTopics: progress?.weakTopics || [],
          weakTopic: progress?.weakTopics?.[0] || "",
          lastActiveAt: progress?.lastActiveAt || null,
          activeThisWeek: progress?.lastActiveAt
            ? new Date(progress.lastActiveAt) >=
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            : false,
          modules,
          moduleScores: completedModules.map((m) => ({
            moduleId: m.moduleId,
            moduleTitle: m.moduleTitle,
            score: m.score || 0,
          })),
        };
      })
    );

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ---------------- MODULES ANALYTICS ---------------- */
router.get("/modules", protect, roleMiddleware("teacher"), async (req, res) => {
  try {
    const allProgress = await Progress.find().lean();

    const moduleMap = {};

    allProgress.forEach((progress) => {
      (progress.modules || []).forEach((module) => {
        const id = module.moduleId || module.gameId || module.moduleTitle || "unknown";

        if (!moduleMap[id]) {
          moduleMap[id] = {
            moduleId: module.moduleId || id,
            moduleTitle: module.moduleTitle || `Module ${module.moduleId || id}`,
            attempts: 0,
            completedCount: 0,
            scores: [],
            accuracies: [],
            totalTime: 0,
          };
        }

        moduleMap[id].attempts += module.attempts || 1;

        if (module.completed) {
          moduleMap[id].completedCount += 1;
        }

        if (typeof module.score === "number") {
          moduleMap[id].scores.push(module.score);
        }

        if (typeof module.accuracy === "number") {
          moduleMap[id].accuracies.push(module.accuracy);
        }

        moduleMap[id].totalTime += module.completionTime || 0;
      });
    });

    const data = Object.values(moduleMap).map((m) => ({
      moduleId: m.moduleId,
      moduleTitle: m.moduleTitle,
      attempts: m.attempts,
      completedCount: m.completedCount,
      averageScore: Math.round(avg(m.scores)),
      averageAccuracy: Math.round(avg(m.accuracies)),
      averageTime: m.completedCount
        ? Math.round(m.totalTime / m.completedCount)
        : 0,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ---------------- WEAK TOPICS ---------------- */
router.get("/weak-topics", protect, roleMiddleware("teacher"), async (req, res) => {
  try {
    const allProgress = await Progress.find().lean();

    const topicCount = {};

    allProgress.forEach((progress) => {
      (progress.weakTopics || []).forEach((topic) => {
        topicCount[topic] = (topicCount[topic] || 0) + 1;
      });

      (progress.modules || []).forEach((module) => {
        (module.weakTopics || []).forEach((topic) => {
          topicCount[topic] = (topicCount[topic] || 0) + 1;
        });
      });
    });

    const data = Object.entries(topicCount)
      .map(([topic, count]) => ({
        topic,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;