const User = require("../models/User");
const Progress = require("../models/Progress");

const getTeacherDashboard = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("name email");

    const studentRows = [];

    for (let student of students) {
      const progress = await Progress.findOne({ studentId: student._id });

      studentRows.push({
        _id: student._id,
        name: student.name,
        email: student.email,
        modulesCompleted: progress?.modulesCompleted || 0,
        averageScore: progress?.averageScore || 0,
        timeSpent: Math.round((progress?.totalTimeSpent || 0) / 60), // seconds → minutes
        weakTopic: progress?.weakTopics?.[0] || "No weak areas",
        activeThisWeek: progress?.lastActiveAt
          ? (Date.now() - new Date(progress.lastActiveAt)) < 7 * 24 * 60 * 60 * 1000
          : false,
      });
    }

    res.json({
      overview: {
        totalStudents: students.length,
      },
      students: studentRows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};

module.exports = { getTeacherDashboard };