// backend/models/Progress.js
const mongoose = require("mongoose");

const moduleProgressSchema = new mongoose.Schema({
  moduleId: { type: String, required: true },
  moduleOrder: { type: Number, required: true },
  title: { type: String, default: "" },
  completed: { type: Boolean, default: false },
  score: { type: Number, default: 0, min: 0, max: 100 },
  attempts: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // minutes
  weakTopics: [{ type: String }],
  lastAttemptAt: { type: Date },
});

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one progress doc per student
    },
    modules: [moduleProgressSchema],
    totalTimeSpent: { type: Number, default: 0 }, // minutes
    lastActiveAt: { type: Date, default: Date.now },
    activeThisWeek: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Update activeThisWeek based on lastActiveAt
progressSchema.pre("save", function (next) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  this.activeThisWeek = this.lastActiveAt > oneWeekAgo;
  next();
});

module.exports = mongoose.model("Progress", progressSchema);