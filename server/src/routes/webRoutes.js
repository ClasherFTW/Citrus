const express = require("express");
const webController = require("../controllers/web/webController");
const { optionalWebAuth, requireWebAuthRedirect } = require("../middleware/webAuthMiddleware");

const router = express.Router();

router.use(optionalWebAuth);
router.get("/", webController.renderLanding);
router.get("/auth", webController.renderAuth);
router.get("/app", webController.renderHome);
router.get("/app/questions/:id", webController.renderQuestion);
router.get("/app/profile", requireWebAuthRedirect, webController.renderProfile);
router.get("/app/users/:id", webController.renderUserProfile);
router.get("/app/chat", requireWebAuthRedirect, webController.renderChat);
router.get("/app/*", webController.renderNotFound);

router.get("/questions/:id", (req, res) => res.redirect(`/app/questions/${req.params.id}`));
router.get("/profile", (_req, res) => res.redirect("/app/profile"));

module.exports = router;
