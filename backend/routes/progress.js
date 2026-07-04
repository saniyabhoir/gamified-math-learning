const express = require("express");
const router = express.Router();

const {
  saveModuleProgress,
  getStudentProgress,
  getAllStudentsProgress,
} = require("../controllers/progressController");

const { protect } = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/save", protect, saveModuleProgress);

router.get("/student/:studentId", protect, getStudentProgress);

router.get(
  "/all",
  protect,
  roleMiddleware("teacher"),
  getAllStudentsProgress
);

module.exports = router;