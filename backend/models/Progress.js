const mongoose = require("mongoose");

// Module schema
const moduleSchema = new mongoose.Schema({
  moduleId: {
    type: Number,
    required: true,
  },

  moduleTitle: {
    type: String,
    required: true,
  },

  gameId: {
    type: String,
  },

  score: {
    type: Number,
    default: 0,
  },

  accuracy: {
    type: Number,
    default: 0,
  },

  mistakes: {
    type: Number,
    default: 0,
  },

  completionTime: {
    type: Number,
    default: 0,
  },

  // ── Module Learning Time Analytics (research metric) ──────────────────────
  // NOT the game timer. This is the total time spent inside the module's
  // learning flow (story, examples, quizzes, feedback, navigation) from the
  // moment the student enters the module until it is successfully completed.
  // `completionTime` above continues to be used as-is by the existing game
  // flows (GamePage.jsx) and is left untouched — this is a separate,
  // additive field so both metrics can be analysed independently.
  // Stored in seconds.
  moduleTime: {
    type: Number,
    default: 0,
  },

  // Reserved for future hint-usage tracking (see research analytics goals).
  // Not currently populated by any UI interaction — defaults to 0 so the
  // schema is ready for research analysis as soon as hint tracking exists.
  hintsUsed: {
    type: Number,
    default: 0,
  },

  stars: {
    type: Number,
    default: 0,
  },

  rewardPoints: {
    type: Number,
    default: 0,
  },

  completed: {
    type: Boolean,
    default: false,
  },

  weakTopics: [
    {
      type: String,
    },
  ],

  attempts: {
    type: Number,
    default: 1,
  },

  playedAt: {
    type: Date,
    default: Date.now,
  },
});

// Main progress schema
const progressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    modules: [moduleSchema],

    modulesCompleted: {
      type: Number,
      default: 0,
    },

    averageScore: {
      type: Number,
      default: 0,
    },

    overallAccuracy: {
      type: Number,
      default: 0,
    },

    totalTimeSpent: {
      type: Number,
      default: 0,
    },

    // Sum of modules[].moduleTime (research metric — total learning time
    // across all modules, in seconds). Additive alongside totalTimeSpent,
    // which is left untouched.
    totalModuleTimeSpent: {
      type: Number,
      default: 0,
    },

    totalRewardPoints: {
      type: Number,
      default: 0,
    },

    weakTopics: [
      {
        type: String,
      },
    ],

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Progress",
  progressSchema
);