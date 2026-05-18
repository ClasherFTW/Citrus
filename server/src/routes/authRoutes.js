const express = require("express");
const authController = require("../controllers/authController");
const { protect, protectFirebaseToken } = require("../middleware/authMiddleware");
const { requireIdToken } = require("../middleware/webAuthMiddleware");
const validateRequest = require("../middleware/validateMiddleware");
const { authValidators } = require("../utils/validators");

const router = express.Router();

router.post(
  "/sync",
  protectFirebaseToken,
  authValidators.syncProfile,
  validateRequest,
  authController.syncProfile
);
router.post("/session", requireIdToken, authController.createSession);
router.delete("/session", authController.clearSession);
router.post("/logout", protectFirebaseToken, authController.logout);
router.get("/me", protect, authController.getMe);

module.exports = router;
