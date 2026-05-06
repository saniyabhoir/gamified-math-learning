// backend/models/Game.js
// Defines each game in the system — referenced by Performance records.

const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // e.g. "like-terms-memory-match", "module-2-game"
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
  },
  moduleName: {
    type: String,
    required: true,
  },
  primaryTopic: {
    type: String,
    required: true,
    // e.g. "like_terms"
  },
  secondaryTopics: [{
    type: String,
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
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
  isActive: {
    type: Boolean,
    default: true,
  },
  icon: {
    type: String,
    default: '🎮',
  },
  description: {
    type: String,
  },
}, {
  timestamps: true,
});

// Seed data for the 2 existing games
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
    icon: '🍬',
    description: 'Flip cards to find matching like terms. Two rounds of increasing difficulty.',
  },
  {
    gameId: 'module-2-game',
    title: 'Simplification Showdown',
    moduleId: 2,
    moduleName: 'Simplification and Combining Like Terms',
    primaryTopic: 'simplification',
    secondaryTopics: ['like_terms_combining', 'invisible_coefficient', 'unlike_terms'],
    difficulty: 'intermediate',
    estimatedMinutes: 12,
    maxScore: 400,
    icon: '🍎',
    description: 'Timed simplification quiz at Priya\'s Fruit Shop.',
  },
];

module.exports = mongoose.model('Game', GameSchema);