// backend/controllers/analyticsController.js
const User = require("../models/User");
// Progress model not yet created — use empty data for now

const getTeacherDashboard = async (req, res) => {
  console.log("✅ Analytics controller hit — user:", req.user?.id);

  try {
    const students      = await User.find({ role: "student" }).select("name email");
    const totalStudents = students.length;

    // No Progress model yet — return students with zero stats
    const studentRows = students.map(student => ({
      _id:              student._id,
      name:             student.name,
      email:            student.email,
      modulesCompleted: 0,
      averageScore:     0,
      timeSpent:        0,
      weakTopic:        null,
      activeThisWeek:   false,
    }));

    const MODULE_TITLES = [
      "Introduction to Algebra",
      "Simplification & Like Terms",
      "Multiplication of Expressions",
      "Substitution & Evaluation",
      "Algebra in Action",
    ];

    const moduleRows = [1, 2, 3, 4, 5].map((moduleId, i) => ({
      moduleId,
      moduleOrder:      moduleId,
      title:            MODULE_TITLES[i],
      completionRate:   0,
      avgScore:         0,
      avgAttempts:      0,
      enrolledStudents: totalStudents,
    }));

    res.json({
      overview: {
        totalStudents,
        averageScore:     0,
        modulesCompleted: 0,
        avgTimeSpent:     0,
        lastUpdated:      new Date().toISOString(),
      },
      modules:  moduleRows,
      students: studentRows,
    });

  } catch (err) {
    console.error("❌ Analytics error:", err);
    res.status(500).json({ message: "Failed to load analytics", error: err.message });
  }
};

module.exports = { getTeacherDashboard };