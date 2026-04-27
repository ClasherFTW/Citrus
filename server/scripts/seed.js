require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Question = require("../src/models/Question");
const Answer = require("../src/models/Answer");
const Chat = require("../src/models/Chat");
const Message = require("../src/models/Message");

const seed = async () => {
  await connectDB();

  await Promise.all([
    Message.deleteMany({}),
    Chat.deleteMany({}),
    Answer.deleteMany({}),
    Question.deleteMany({}),
    User.deleteMany({}),
  ]);

  const [admin, alice, bob] = await User.create([
    {
      username: "admin",
      email: "admin@citrus.dev",
      firebaseUid: "seed_admin_uid",
      role: "admin",
      reputation: 100,
    },
    {
      username: "alice",
      email: "alice@citrus.dev",
      firebaseUid: "seed_alice_uid",
      role: "user",
      reputation: 15,
    },
    {
      username: "bob",
      email: "bob@citrus.dev",
      firebaseUid: "seed_bob_uid",
      role: "user",
      reputation: 25,
    },
  ]);

  const question = await Question.create({
    title: "How do I structure a scalable Node.js backend with Express and MongoDB?",
    description:
      "I am building a Q&A platform and need guidance on layered architecture, service abstraction, and clean APIs.",
    tags: ["nodejs", "express", "mongodb", "architecture"],
    userId: alice._id,
  });

  await Answer.create([
    {
      questionId: question._id,
      userId: bob._id,
      content:
        "Use route -> controller -> service -> model separation, central error handling, and validation middleware.",
    },
    {
      questionId: question._id,
      userId: admin._id,
      content:
        "Add pagination, auth guards, and consistent response contracts from day one for better frontend integration.",
    },
  ]);

  question.answersCount = 2;
  await question.save();

  // eslint-disable-next-line no-console
  console.log("Seed completed successfully.");
  // eslint-disable-next-line no-console
  console.log("Sample users seeded with Firebase UIDs for local development.");

  await mongoose.connection.close();
};

seed().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
