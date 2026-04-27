require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Question = require("../src/models/Question");
const Answer = require("../src/models/Answer");
const { createEmbedding } = require("../src/services/rag/embedder");

const embedData = async () => {
  await connectDB();

  const [questions, answers] = await Promise.all([
    Question.find({}).select("_id title description tags").lean(),
    Answer.find({}).select("_id questionId content").lean(),
  ]);

  const questionEmbeddings = await Promise.all(
    questions.map(async (question) => ({
      id: `question:${question._id}`,
      metadata: {
        type: "question",
        questionId: question._id.toString(),
        tags: question.tags,
        title: question.title,
      },
      embedding: await createEmbedding(`${question.title}\n${question.description}`),
    }))
  );

  const answerEmbeddings = await Promise.all(
    answers.map(async (answer) => ({
      id: `answer:${answer._id}`,
      metadata: {
        type: "answer",
        answerId: answer._id.toString(),
        questionId: answer.questionId.toString(),
      },
      embedding: await createEmbedding(answer.content),
    }))
  );

  const total = questionEmbeddings.length + answerEmbeddings.length;

  // Placeholder: in Phase 2, upsert these vectors to Pinecone (or equivalent).
  // eslint-disable-next-line no-console
  console.log(`Generated ${total} embeddings (dry-run).`);

  await mongoose.connection.close();
};

embedData().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error("Embedding job failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
