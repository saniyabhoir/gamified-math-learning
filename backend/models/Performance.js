// backend/models/Performance.js
// Core analytics schema — every game session writes one record here.
// This single collection powers ALL teacher analytics aggregations.

const mongoose = require('mongoose');

const MistakeSchema = new mongoose.Schema({
  questionId:   { type: String },
  conceptTag:   { type: String, required: true }, // e.g. "like_terms", "simplification"
  errorType:    { type: String },                 // e.g. "unlike_terms_merged"
  userAnswer:   { type: String },
  correctAnswer:{ type: String },
  timestamp:    { type: Date, default: Date.now },
}, { _id: false });

const PerformanceSchema = new mongoose.Schema({
  // ── Who & What ──────────────────────────────────────────────────────────
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  gameId: {
    type: String,
    required: true,
    // e.g. "like-terms-memory-match", "module-2-game"
  },
  moduleId: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    index: true,
  },
  moduleName: {
    type: String,
    // e.g. "Introduction to Algebra"
  },

  // ── Topic / Concept ──────────────────────────────────────────────────────
  topic: {
    type: String,
    required: true,
    // primary concept tested: "like_terms" | "simplification" | "multiplication"
    // | "substitution" | "factorization" | "unknown_values" | "variables"
    // | "constants" | "terms" | "unlike_terms"
    index: true,
  },

  // ── Core Metrics ─────────────────────────────────────────────────────────
  score: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxScore: {
    type: Number,
    default: 100,
  },
  accuracy: {
    type: Number,  // 0–100 (percentage)
    default: 0,
    min: 0,
    max: 100,
  },
  attempts: {
    type: Number,
    default: 1,
    min: 1,
  },
  timeSpent: {
    type: Number,  // seconds
    default: 0,
    min: 0,
  },
  hintsUsed: {
    type: Number,
    default: 0,
    min: 0,
  },
  completed: {
    type: Boolean,
    default: false,
    index: true,
  },
  stars: {
    type: Number,
    default: 0,
    min: 0,
    max: 3,
  },

  // ── Mistake Log ───────────────────────────────────────────────────────────
  mistakes: [MistakeSchema],  // array of individual mistake records

  // ── Session metadata ──────────────────────────────────────────────────────
  sessionId: {
    type: String,  // unique session identifier for deduplication
  },
  isRetry: {
    type: Boolean,
    default: false,
  },
  rewardPoints: {
    type: Number,
    default: 0,
  },

}, {
  timestamps: true,  // adds createdAt, updatedAt automatically
});

// ── Compound indexes for fast aggregation queries ────────────────────────────
PerformanceSchema.index({ studentId: 1, moduleId: 1 });
PerformanceSchema.index({ studentId: 1, topic: 1 });
PerformanceSchema.index({ moduleId: 1, topic: 1 });
PerformanceSchema.index({ createdAt: -1 });
PerformanceSchema.index({ studentId: 1, createdAt: -1 });

// ── Virtual: computed accuracy ───────────────────────────────────────────────
PerformanceSchema.virtual('accuracyLabel').get(function () {
  if (this.accuracy >= 80) return 'Strong';
  if (this.accuracy >= 60) return 'Average';
  return 'Needs Attention';
});

// ── Static: topic-to-module mapping ──────────────────────────────────────────
PerformanceSchema.statics.TOPIC_MODULE_MAP = {
  unknown_values:   1,
  variables:        1,
  constants:        1,
  terms:            1,
  like_terms:       1,
  unlike_terms:     1,
  simplification:   2,
  like_terms_combining: 2,
  invisible_coefficient: 2,
  multiplication:   3,
  distributive_property: 3,
  exponent_addition: 3,
  substitution:     4,
  bodmas:           4,
  real_world_formulas: 4,
  algebra_in_action: 5,
  multi_step_integration: 5,
};

module.exports = mongoose.model('Performance', PerformanceSchema);