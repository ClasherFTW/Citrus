const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    upvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
    },
    tags: {
      type: [String],
      default: [],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
    answersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

questionSchema.index({ title: "text", description: "text", tags: "text" });
questionSchema.index({ tags: 1, createdAt: -1 });

module.exports = mongoose.model("Question", questionSchema);
