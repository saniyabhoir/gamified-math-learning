const Progress = require("../models/Progress");
const User = require("../models/User");

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const clampPercentage = (value) => {
  const num = Number(value) || 0;
  return Math.min(100, Math.max(0, num));
};

const safeNumber = (value) => Number(value) || 0;

// ─────────────────────────────────────────────
// SAVE MODULE PROGRESS
// ─────────────────────────────────────────────
const saveModuleProgress = async (req, res) => {
  try {
    const studentId = req.user._id;

    const {
      moduleId,
      moduleTitle,
      gameId,
      score = 0,
      accuracy = 0,
      mistakes = 0,
      completionTime = 0,
      stars = 0,
      rewardPoints = 0,
      completed = false,
      weakTopics = [],
    } = req.body;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: "moduleId is required",
      });
    }

    const safeScore = clampPercentage(score);
    const safeAccuracy = clampPercentage(accuracy);
    const safeMistakes = safeNumber(mistakes);
    const safeCompletionTime = safeNumber(completionTime);
    const safeStars = safeNumber(stars);
    const safeRewardPoints = safeNumber(rewardPoints);

    let progress = await Progress.findOne({ studentId });

    if (!progress) {
      progress = new Progress({
        studentId,
        modules: [],
      });
    }

    const existing = progress.modules.find(
      (m) => String(m.moduleId) === String(moduleId)
    );

    if (existing) {
      existing.attempts = (existing.attempts || 0) + 1;

      // score and accuracy are percentages, so never allow above 100
      existing.score = Math.max(existing.score || 0, safeScore);
      existing.accuracy = Math.max(existing.accuracy || 0, safeAccuracy);

      existing.mistakes = safeMistakes;
      existing.stars = Math.max(existing.stars || 0, safeStars);

      existing.completionTime =
        existing.completionTime > 0 && safeCompletionTime > 0
          ? Math.min(existing.completionTime, safeCompletionTime)
          : safeCompletionTime;

      existing.rewardPoints = Math.max(
        existing.rewardPoints || 0,
        safeRewardPoints
      );

      existing.completed = existing.completed || Boolean(completed);
      existing.weakTopics = Array.isArray(weakTopics) ? weakTopics : [];
      existing.playedAt = new Date();
    } else {
      progress.modules.push({
        moduleId,
        moduleTitle,
        gameId,
        score: safeScore,
        accuracy: safeAccuracy,
        mistakes: safeMistakes,
        completionTime: safeCompletionTime,
        stars: safeStars,
        rewardPoints: safeRewardPoints,
        completed: Boolean(completed),
        weakTopics: Array.isArray(weakTopics) ? weakTopics : [],
        attempts: 1,
        playedAt: new Date(),
      });
    }

    // ── SUMMARY CALCULATION ─────────────────────
    const modules = progress.modules;

    progress.modulesCompleted = modules.filter((m) => m.completed).length;

    progress.averageScore =
      modules.length > 0
        ? Math.round(
            modules.reduce(
              (sum, m) => sum + clampPercentage(m.score),
              0
            ) / modules.length
          )
        : 0;

    progress.overallAccuracy =
      modules.length > 0
        ? Math.round(
            modules.reduce(
              (sum, m) => sum + clampPercentage(m.accuracy),
              0
            ) / modules.length
          )
        : 0;

    progress.totalTimeSpent = modules.reduce(
      (sum, m) => sum + safeNumber(m.completionTime),
      0
    );

    progress.totalRewardPoints = modules.reduce(
      (sum, m) => sum + safeNumber(m.rewardPoints),
      0
    );

    progress.weakTopics = [
      ...new Set(
        modules.flatMap((m) =>
          Array.isArray(m.weakTopics) ? m.weakTopics : []
        )
      ),
    ];

    progress.lastActiveAt = new Date();

    await progress.save();

    return res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("saveModuleProgress error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save progress",
    });
  }
};

// ─────────────────────────────────────────────
// GET STUDENT PROGRESS
// ─────────────────────────────────────────────
const getStudentProgress = async (req, res) => {
  try {
    const studentId = req.user._id;

    const progress = await Progress.findOne({ studentId });

    return res.status(200).json({
      success: true,
      data: progress || {
        studentId,
        modules: [],
        modulesCompleted: 0,
        averageScore: 0,
        overallAccuracy: 0,
        totalTimeSpent: 0,
        totalRewardPoints: 0,
        weakTopics: [],
      },
    });
  } catch (error) {
    console.error("getStudentProgress error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch progress",
    });
  }
};

// ─────────────────────────────────────────────
// GET ALL STUDENTS PROGRESS (TEACHER)
// ─────────────────────────────────────────────
const getAllStudentsProgress = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("name email");

    const progressDocs = await Progress.find({}).lean();

    const map = {};

    progressDocs.forEach((p) => {
      if (p.studentId) {
        map[p.studentId.toString()] = p;
      }
    });

    const result = students.map((student) => {
      const p = map[student._id.toString()];

      if (!p) {
        return {
          studentId: student._id,
          name: student.name,
          email: student.email,
          modulesCompleted: 0,
          averageScore: 0,
          overallAccuracy: 0,
          totalTimeSpent: 0,
          totalRewardPoints: 0,
          weakTopics: [],
          lastActiveAt: null,
          modules: [],
        };
      }

      return {
        studentId: student._id,
        name: student.name,
        email: student.email,
        modulesCompleted: p.modulesCompleted || 0,
        averageScore: clampPercentage(p.averageScore),
        overallAccuracy: clampPercentage(p.overallAccuracy),
        totalTimeSpent: p.totalTimeSpent || 0,
        totalRewardPoints: p.totalRewardPoints || 0,
        weakTopics: p.weakTopics || [],
        lastActiveAt: p.lastActiveAt || null,
        modules: p.modules || [],
      };
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("getAllStudentsProgress error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard",
    });
  }
};

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
module.exports = {
  saveModuleProgress,
  getStudentProgress,
  getAllStudentsProgress,
};