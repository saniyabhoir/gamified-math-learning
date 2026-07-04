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