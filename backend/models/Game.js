// backend/models/Game.js
// Improved version with analytics-friendly structure

const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema(
  {
    gameId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    moduleId: {
      type: Number,
      required: true,
      min: 1,
      index: true, // 🔥 faster filtering by module
    },

    moduleName: {
      type: String,
      required: true,
    },

    primaryTopic: {
      type: String,
      required: true,
      index: true, // 🔥 useful for weak topic analysis
    },

    secondaryTopics: [
      {
        type: String,
      },
    ],

    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },

    estimatedMinutes: {
      type: Number,
      default: 10,
      min: 1,
    },

    maxScore: {
      type: Number,
      default: 100,
    },

    // 🔥 NEW: helps normalize scores across games
    passingScore: {
      type: Number,
      default: 40,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    icon: {
      type: String,
      default: '🎮',
    },

    description: {
      type: String,
    },

    // 🔥 NEW: track usage (optional but powerful)
    totalPlays: {
      type: Number,
      default: 0,
    },

    averageScore: {
      type: Number,
      default: 0,
    },

    averageTime: {
      type: Number,
      default: 0, // seconds
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 Compound index (important for filtering)
GameSchema.index({ moduleId: 1, difficulty: 1 });

// 🔥 Seed data
GameSchema.statics.SEED_DATA = [
  {
    gameId: 'like-terms-memory-match',
    title: 'Like Terms Memory Match',
    moduleId: 1,
    moduleName: 'Introduction to Algebra',
    primaryTopic: 'like_terms',
    secondaryTopics: ['variables', 'unlike_terms'],
    difficulty: 'beginner',
    estimatedMinutes: 10,
    maxScore: 150,
    passingScore: 50,
    icon: '🍬',
    description:
      'Flip cards to find matching like terms. Two rounds of increasing difficulty.',
  },
  {
    gameId: 'module-2-game',
    title: 'Simplification Showdown',
    moduleId: 2,
    moduleName: 'Simplification and Combining Like Terms',
    primaryTopic: 'simplification',
    secondaryTopics: [
      'like_terms_combining',
      'invisible_coefficient',
      'unlike_terms',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 12,
    maxScore: 400,
    passingScore: 120,
    icon: '🍎',
    description:
      "Timed simplification quiz at Priya's Fruit Shop.",
  },
];

// 🔥 Optional helper method
GameSchema.statics.findByGameId = function (gameId) {
  return this.findOne({ gameId });
};

module.exports = mongoose.model('Game', GameSchema);