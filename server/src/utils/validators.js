const { body, param, query } = require("express-validator");

const mongoId = /^[0-9a-fA-F]{24}$/;
const voteTypes = ["upvote", "downvote"];

const authValidators = {
  syncProfile: [
    body("username")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3 to 30 characters."),
    body("avatarUrl")
      .optional({ checkFalsy: true })
      .isURL()
      .withMessage("avatarUrl must be a valid URL."),
  ],
};

const questionValidators = {
  create: [
    body("title")
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage("Title must be 10 to 200 characters."),
    body("description")
      .trim()
      .isLength({ min: 20 })
      .withMessage("Description must be at least 20 characters."),
    body("tags")
      .custom((value) => Array.isArray(value) || typeof value === "string")
      .withMessage("Tags must be an array or comma-separated string."),
  ],
  update: [
    param("id").matches(mongoId).withMessage("Invalid question id."),
    body("title")
      .optional()
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage("Title must be 10 to 200 characters."),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 20 })
      .withMessage("Description must be at least 20 characters."),
    body("tags")
      .optional()
      .custom((value) => Array.isArray(value) || typeof value === "string")
      .withMessage("Tags must be an array or comma-separated string."),
  ],
  getOne: [param("id").matches(mongoId).withMessage("Invalid question id.")],
  vote: [
    param("id").matches(mongoId).withMessage("Invalid question id."),
    body("voteType")
      .isIn(voteTypes)
      .withMessage("voteType must be upvote or downvote."),
  ],
  list: [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1."),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50."),
    query("sortBy")
      .optional()
      .isIn(["newest", "oldest", "votes", "answers"])
      .withMessage("sortBy must be one of newest, oldest, votes, answers."),
  ],
};

const answerValidators = {
  create: [
    body("questionId").matches(mongoId).withMessage("Invalid question id."),
    body("content")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Answer content must be at least 10 characters."),
  ],
  update: [
    param("id").matches(mongoId).withMessage("Invalid answer id."),
    body("content")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Answer content must be at least 10 characters."),
  ],
  remove: [param("id").matches(mongoId).withMessage("Invalid answer id.")],
  getByQuestion: [
    param("questionId").matches(mongoId).withMessage("Invalid question id."),
  ],
  vote: [
    param("id").matches(mongoId).withMessage("Invalid answer id."),
    body("voteType")
      .isIn(voteTypes)
      .withMessage("voteType must be upvote or downvote."),
  ],
};

const userValidators = {
  getById: [param("id").matches(mongoId).withMessage("Invalid user id.")],
  list: [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1."),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50."),
  ],
};

const aiValidators = {
  chat: [
    body("question")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Question must be at least 3 characters."),
    body("useRetrieval")
      .optional()
      .isBoolean()
      .withMessage("useRetrieval must be a boolean."),
  ],
};

const chatValidators = {
  startChat: [
    body("participantId")
      .matches(mongoId)
      .withMessage("participantId must be a valid user id."),
  ],
  getMessages: [
    param("chatId").matches(mongoId).withMessage("Invalid chat id."),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1."),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100."),
  ],
  sendMessage: [
    param("chatId").matches(mongoId).withMessage("Invalid chat id."),
    body("content")
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage("Message content is required."),
  ],
};

module.exports = {
  authValidators,
  questionValidators,
  answerValidators,
  userValidators,
  aiValidators,
  chatValidators,
};
