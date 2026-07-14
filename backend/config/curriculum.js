// backend/config/curriculum.js
//
// There is no Modules/Course collection in MongoDB — Progress.modules only
// stores an entry once a student has actually attempted a module, so any
// module nobody has touched yet simply doesn't exist in the data.
//
// This canonical list lets the teacher dashboard show the FULL curriculum
// (all 5 modules) in Module Analytics, defaulting unplayed modules to 0s,
// instead of only showing whichever modules happen to have data.
//
// Titles match module_title in frontend/src/data/modules/moduleN.json,
// which is exactly what ModulePage.jsx sends as `moduleTitle` on save.

const CURRICULUM_MODULES = [
  { moduleId: 1, title: "Introduction to Algebra" },
  { moduleId: 2, title: "Simplification and Combining Like Terms" },
  { moduleId: 3, title: "Multiplication of Algebraic Expressions" },
  { moduleId: 4, title: "Substitution and Evaluation" },
  { moduleId: 5, title: "Algebra in Action" },
];

module.exports = { CURRICULUM_MODULES };
