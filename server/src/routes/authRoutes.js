const express = require("express");
const authController = require("../controllers/authController");
const { protect, protectFirebaseToken } = require("../middleware/authMiddleware");
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
router.post("/logout", protectFirebaseToken, authController.logout);
router.get("/me", protect, authController.getMe);

module.exports = router;
