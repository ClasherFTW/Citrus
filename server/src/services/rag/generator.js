const {
  generateAnswerWithOllama,
  streamAnswerWithOllama,
} = require("./ollama");

const generateAnswer = async ({ question, contextChunks = [] }) => {
  return generateAnswerWithOllama({
    question,
    contextChunks,
  });
};

module.exports = {
  generateAnswer,
  generateAnswerStream: streamAnswerWithOllama,
};
