const asyncHandler = require("../../utils/asyncHandler");
const questionService = require("../../services/questionService");
const answerService = require("../../services/answerService");
const { getProfileById } = require("../../services/userService");
const { listChatsForUser } = require("../../services/chatService");
const Question = require("../../models/Question");
const Answer = require("../../models/Answer");

const getFirebaseClientConfig = () => {
  const fallbackAuthDomain =
    process.env.FIREBASE_WEB_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || "";
  const authOnlyOverrideDomain = String(process.env.FIREBASE_AUTH_ONLY_DOMAIN || "").trim();

  return {
    apiKey: process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY || "",
    authDomain: authOnlyOverrideDomain || fallbackAuthDomain,
    projectId:
      process.env.FIREBASE_WEB_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket:
      process.env.FIREBASE_WEB_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId:
      process.env.FIREBASE_WEB_MESSAGING_SENDER_ID ||
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
      "",
    appId: process.env.FIREBASE_WEB_APP_ID || process.env.VITE_FIREBASE_APP_ID || "",
    measurementId:
      process.env.FIREBASE_WEB_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  };
};

const inDateRange = (dateValue, dateRange) => {
  if (dateRange === "any") return true;

  const now = Date.now();
  const createdAt = new Date(dateValue).getTime();
  const diff = now - createdAt;

  if (Number.isNaN(createdAt)) return true;

  const day = 24 * 60 * 60 * 1000;
  if (dateRange === "24h") return diff <= day;
  if (dateRange === "7d") return diff <= 7 * day;
  if (dateRange === "30d") return diff <= 30 * day;
  return true;
};

const getRecentProfileActivity = async (userId) => {
  const [recentQuestions, recentAnswers] = await Promise.all([
    Question.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    Answer.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("questionId", "title")
      .lean(),
  ]);

  return { recentQuestions, recentAnswers };
};

const renderLanding = asyncHandler(async (_req, res) => {
  res.render("landing", {
    title: "CyLink",
  });
});

const renderHome = asyncHandler(async (req, res) => {
  const savedOnly = req.query.saved === "1";
  const filters = {
    search: req.query.search || "",
    tag: req.query.tag || "",
    sortBy: req.query.sortBy || "newest",
    dateRange: req.query.dateRange || "any",
    unansweredOnly: req.query.unansweredOnly === "1",
    saved: savedOnly,
  };

  const serverSort = filters.sortBy === "topWeek" ? "votes" : filters.sortBy;

  const data = await questionService.listQuestions({
    page: 1,
    limit: 60,
    search: filters.search,
    sortBy: serverSort,
    tags: filters.tag,
    currentUserId: req.webUser?._id || null,
  });

  let rows = [...data.items];
  rows = rows.filter((question) => inDateRange(question.createdAt, filters.dateRange));

  if (filters.unansweredOnly) {
    rows = rows.filter((question) => (question.answersCount || 0) === 0);
  }

  if (filters.sortBy === "topWeek") {
    rows = rows.filter((question) => inDateRange(question.createdAt, "7d"));
    rows.sort((a, b) => (b.voteScore || 0) - (a.voteScore || 0));
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  const availableTags = [...new Set(data.items.flatMap((item) => item.tags || []))].slice(0, 16);

  res.render("app_home", {
    title: "CyLink | Questions",
    activeNav: savedOnly ? "saved" : "questions",
    currentUser: req.webUser || null,
    questions: rows.slice(start, start + pageSize),
    allLoadedCount: data.items.length,
    availableTags,
    stats: {
      answeredCount: rows.filter((item) => (item.answersCount || 0) > 0).length,
      tagCount: availableTags.length,
      today: new Date().toLocaleDateString(),
      resultCount: rows.length,
    },
    filters,
    pagination: {
      page: safePage,
      totalPages,
    },
  });
});

const renderQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.getQuestionById(req.params.id, req.webUser?._id || null);
  const answers = await answerService.listAnswersByQuestion({
    questionId: req.params.id,
    page: 1,
    limit: 100,
    sortBy: "votes",
    currentUserId: req.webUser?._id || null,
  });

  res.render("app_question", {
    title: `${question.title} | CyLink`,
    activeNav: "questions",
    currentUser: req.webUser || null,
    question,
    answers: answers.items,
  });
});

const renderProfile = asyncHandler(async (req, res) => {
  const userId = req.webUser?._id;
  const profile = await getProfileById(userId);
  const { recentQuestions, recentAnswers } = await getRecentProfileActivity(userId);

  res.render("app_profile", {
    title: "My Profile | CyLink",
    activeNav: "profile",
    currentUser: req.webUser || null,
    profile,
    recentQuestions,
    recentAnswers,
  });
});

const renderUserProfile = asyncHandler(async (req, res) => {
  const profile = await getProfileById(req.params.id);
  const { recentQuestions, recentAnswers } = await getRecentProfileActivity(req.params.id);

  res.render("app_user_profile", {
    title: `${profile.username} | CyLink`,
    activeNav: "questions",
    currentUser: req.webUser || null,
    profile,
    recentQuestions,
    recentAnswers,
  });
});

const renderChat = asyncHandler(async (req, res) => {
  const chatResult = await listChatsForUser({
    userId: req.webUser._id,
    page: 1,
    limit: 30,
  });

  res.render("app_chat", {
    title: "Realtime Chat | CyLink",
    activeNav: "chat",
    currentUser: req.webUser || null,
    initialParticipant: String(req.query.participant || ""),
    initialChats: chatResult.items,
  });
});

const renderAuth = asyncHandler(async (req, res) => {
  res.render("auth", {
    title: "Sign in | CyLink",
    currentUser: req.webUser || null,
    firebaseClientConfig: getFirebaseClientConfig(),
    nextPath: String(req.query.next || "/app").trim() || "/app",
  });
});

const renderNotFound = asyncHandler(async (_req, res) => {
  res.status(404).render("not_found", {
    title: "404 | CyLink",
  });
});

module.exports = {
  renderLanding,
  renderHome,
  renderQuestion,
  renderProfile,
  renderUserProfile,
  renderChat,
  renderAuth,
  renderNotFound,
};
