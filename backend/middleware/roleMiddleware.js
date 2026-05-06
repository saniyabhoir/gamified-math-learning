// backend/middleware/roleMiddleware.js

/**
 * Role-based access control middleware factory.
 *
 * Usage:
 *   router.get("/analytics", authMiddleware, roleMiddleware("teacher"), handler)
 *   router.get("/modules",   authMiddleware, roleMiddleware("student", "teacher"), handler)
 *
 * Must be used AFTER authMiddleware (which populates req.user.role).
 *
 * @param {...string} allowedRoles - Roles permitted to access the route
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This route requires one of: ${allowedRoles.join(", ")}.`,
      });
    }

    next();
  };
};

module.exports = roleMiddleware;

// ── Usage examples (for reference) ───────────────────────────────────────────
//
// const authMiddleware = require("./authMiddleware");
// const roleMiddleware = require("./roleMiddleware");
//
// // Only teachers can access analytics
// router.get("/analytics", authMiddleware, roleMiddleware("teacher"), analyticsHandler);
//
// // Only students can access learning modules
// router.get("/modules", authMiddleware, roleMiddleware("student"), modulesHandler);
//
// // Both roles allowed
// router.get("/profile", authMiddleware, roleMiddleware("student", "teacher"), profileHandler);
