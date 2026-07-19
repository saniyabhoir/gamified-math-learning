const express = require("express");
const User = require("../models/User");
const Progress = require("../models/Progress");
const { CURRICULUM_MODULES } = require("../config/curriculum");
const {
  clampPercentage,
  clampStars,
  average,
} = require("../utils/progressMath");

const { protect } = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// CLEANUP: clampScore/clampStars/avg used to be defined locally here as a
// second, independent copy of the same logic already living in
// progressController.js. Both now pull from utils/progressMath.js so a
// module score is clamped identically whether it's being saved or read for
// analytics. Local alias kept so the rest of this file's variable names
// don't need to change.
const clampScore = clampPercentage;
const avg = average;

// A student counts as "active" if their Progress doc has moved in the last
// 7 days. Mirrors the activeThisWeek window already used in /students.
const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const isActiveWithin = (date, windowMs) =>
  !!date && new Date(date).getTime() >= Date.now() - windowMs;

/* ---------------- OVERVIEW ---------------- */
router.get("/overview", protect, roleMiddleware("teacher"), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const allProgress = await Progress.find().lean();

    const completedModules = allProgress.flatMap((p) =>
      (p.modules || []).filter((m) => m.completed)
    );

    // FIX: clamp defensively — see clampScore() above.
    const allScores = completedModules.map((m) => clampScore(m.score));
    const totalCompleted = completedModules.length;

    // FIX: frontend (OverviewCards.jsx) expects `modulesCompleted` rendered
    // as a percentage ("Completion Rate"), not the raw `totalCompleted` count.
    // Completion rate = completed attempts / (students * total curriculum modules).
    // FIX: use the canonical curriculum size (CURRICULUM_MODULES), not just
    // whichever module IDs happen to already have data — otherwise the rate
    // is only ever computed against modules someone has already touched,
    // which inflates it as more students start but nobody finishes.
    const totalPossibleCompletions = totalStudents * CURRICULUM_MODULES.length;
    const modulesCompleted =
      totalPossibleCompletions > 0
        ? Math.round((totalCompleted / totalPossibleCompletions) * 100)
        : 0;

    // FIX: `avgTimeSpent` was never computed/returned. Progress.totalTimeSpent
    // is stored in seconds, so we average across students and convert to minutes.
    const totalTimeSpentSeconds = allProgress.reduce(
      (sum, p) => sum + (p.totalTimeSpent || 0),
      0
    );
    const avgTimeSpent =
      totalStudents > 0
        ? Math.round(totalTimeSpentSeconds / totalStudents / 60) // seconds -> minutes
        : 0;

    // NEW: Active Students — count of students whose Progress.lastActiveAt
    // falls inside the last 7 days. Reuses allProgress already loaded above,
    // so this adds no extra query.
    const activeStudents = allProgress.filter((p) =>
      isActiveWithin(p.lastActiveAt, ACTIVE_WINDOW_MS)
    ).length;

    // NEW: Average Stars Earned — mean of the 0-3 star rating across every
    // completed module attempt class-wide. completedModules is already
    // computed above for the score aggregation, so this is a cheap extra pass.
    const avgStars = Number(
      avg(completedModules.map((m) => clampStars(m.stars))).toFixed(1)
    );

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        averageScore: Math.round(avg(allScores)),
        modulesCompleted,
        avgTimeSpent,
        avgStars,
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
          // FIX: clamp defensively in case of stale/dirty score data.
          averageScore: clampScore(
            progress?.averageScore ||
              Math.round(avg(completedModules.map((m) => m.score || 0)))
          ),
          overallAccuracy: progress?.overallAccuracy || 0,
          // FIX: StudentsTable.jsx expects `timeSpent` in MINUTES, not
          // `totalTimeSpent` in seconds.
          timeSpent: Math.round((progress?.totalTimeSpent || 0) / 60),
          totalRewardPoints: progress?.totalRewardPoints || 0,
          // NEW: per-student average stars (0-3), powers the Leaderboard and
          // the student detail modal. Derived from completedModules already
          // computed above for this student — no extra query.
          avgStars: Number(
            avg(completedModules.map((m) => clampStars(m.stars))).toFixed(1)
          ),
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
            score: clampScore(m.score),
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

    // FIX: ModuleAnalytics.jsx requires every module object to contain
    // title, avgAttempts, completionRate, avgScore, enrolledStudents and
    // moduleOrder. The previous implementation returned a completely
    // different shape (moduleTitle/attempts/completedCount/averageScore/
    // averageAccuracy/averageTime), none of which the UI reads.
    const moduleMap = {};

    // FIX: pre-seed every module from the canonical curriculum so modules
    // nobody has attempted yet still show up as a 0% card, instead of only
    // ever displaying modules that already happen to have data.
    CURRICULUM_MODULES.forEach((cm) => {
      moduleMap[String(cm.moduleId)] = {
        moduleId: cm.moduleId,
        title: cm.title,
        enrolledStudentIds: new Set(),
        completedCount: 0,
        totalAttempts: 0,
        scores: [],
      };
    });

    allProgress.forEach((progress) => {
      // A student "enrolls" in a module the moment they have an entry for
      // it in progress.modules (whether completed or still in progress).
      // Track enrolled students with a Set so each student is only ever
      // counted once, even though saveModuleProgress keeps a single entry
      // per moduleId per student.
      (progress.modules || []).forEach((module) => {
        const id =
          module.moduleId != null
            ? String(module.moduleId)
            : module.gameId || module.moduleTitle || "unknown";

        if (!moduleMap[id]) {
          moduleMap[id] = {
            moduleId: module.moduleId ?? id,
            title: module.moduleTitle || `Module ${module.moduleId ?? id}`,
            enrolledStudentIds: new Set(),
            completedCount: 0,
            totalAttempts: 0,
            scores: [],
          };
        }

        const entry = moduleMap[id];

        entry.enrolledStudentIds.add(String(progress.studentId));

        if (module.completed) {
          entry.completedCount += 1;
        }

        entry.totalAttempts += module.attempts || 1;

        if (typeof module.score === "number") {
          entry.scores.push(clampScore(module.score));
        }
      });
    });

    const data = Object.values(moduleMap)
      .map((m) => {
        const enrolledStudents = m.enrolledStudentIds.size;

        return {
          moduleId: m.moduleId,
          // moduleOrder drives both the card icon and the "M#" label on the
          // frontend, so it must be a stable numeric sequence — moduleId
          // already serves that purpose in the data model.
          moduleOrder: Number(m.moduleId) || 0,
          title: m.title,
          enrolledStudents,
          completionRate: enrolledStudents
            ? Math.round((m.completedCount / enrolledStudents) * 100)
            : 0,
          avgScore: Math.round(avg(m.scores)),
          avgAttempts: enrolledStudents
            ? Number((m.totalAttempts / enrolledStudents).toFixed(1))
            : 0,
        };
      })
      .sort((a, b) => a.moduleOrder - b.moduleOrder);

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