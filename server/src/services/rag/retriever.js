const { getPineconeClient } = require("../../config/pinecone");

const retrieveRelevantContext = async ({
  embedding,
  question,
  topK = 5,
}) => {
  const pinecone = getPineconeClient();

  if (!pinecone) {
    // Placeholder response for future vector retrieval integration.
    return [];
  }

  // Example shape kept for future compatibility.
  // eslint-disable-next-line no-unused-vars
  const _request = { embedding, question, topK };

  return [];
};

module.exports = {
  retrieveRelevantContext,
};
