const OpenAI = require("openai");

let openAIClient = null;

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!openAIClient) {
    openAIClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openAIClient;
};

const getOpenAIModel = () => process.env.OPENAI_MODEL || "gpt-4o-mini";

module.exports = {
  getOpenAIClient,
  getOpenAIModel,
};
