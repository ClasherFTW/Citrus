const express = require("express");
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateMiddleware");
const { userValidators } = require("../utils/validators");

const router = express.Router();

router.get("/", protect, userValidators.list, validateRequest, userController.listUsers);
router.get("/me", protect, userController.getMyProfile);
router.get("/:id", userValidators.getById, validateRequest, userController.getUserProfile);

module.exports = router;
