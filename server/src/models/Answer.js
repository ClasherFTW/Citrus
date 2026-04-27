const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    upvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    votes: {
      type: voteSchema,
      default: () => ({
        upvoters: [],
        downvoters: [],
      }),
    },
    voteScore: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

answerSchema.index({ questionId: 1, createdAt: -1 });

module.exports = mongoose.model("Answer", answerSchema);
