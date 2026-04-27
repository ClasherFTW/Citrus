const { createEmbedding } = require("./embedder");
const { retrieveRelevantContext } = require("./retriever");
const { generateAnswer, generateAnswerStream } = require("./generator");

const runRagPipeline = async ({ question, useRetrieval = true }) => {
  const embedding = await createEmbedding(question);
  const retrievedContext = useRetrieval
    ? await retrieveRelevantContext({ embedding, question, topK: 5 })
    : [];

  const contextChunks = retrievedContext.map((item) =>
    typeof item === "string" ? item : item?.content || ""
  );

  const generation = await generateAnswer({
    question,
    contextChunks,
  });

  return {
    question,
    ...generation,
    retrievedContext,
  };
};

const runRagPipelineStream = async ({
  question,
  useRetrieval = true,
  onToken,
}) => {
  const embedding = await createEmbedding(question);
  const retrievedContext = useRetrieval
    ? await retrieveRelevantContext({ embedding, question, topK: 5 })
    : [];

  const contextChunks = retrievedContext.map((item) =>
    typeof item === "string" ? item : item?.content || ""
  );

  const generation = await generateAnswerStream({
    question,
    contextChunks,
    onToken,
  });

  return {
    question,
    ...generation,
    retrievedContext,
  };
};

module.exports = {
  runRagPipeline,
  runRagPipelineStream,
};
