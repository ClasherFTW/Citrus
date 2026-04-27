const asyncHandler = require("../utils/asyncHandler");
const { runRagPipeline, runRagPipelineStream } = require("../services/rag/pipeline");

const chatWithAI = asyncHandler(async (req, res) => {
  const { question, useRetrieval = true } = req.body;

  const result = await runRagPipeline({
    question,
    useRetrieval,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

const chatWithAIStream = async (req, res, next) => {
  const { question, useRetrieval = true } = req.body;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    await runRagPipelineStream({
      question,
      useRetrieval,
      onToken: (token) => {
        res.write(token);
        if (typeof res.flush === "function") {
          res.flush();
        }
      },
    });

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      return next(error);
    }

    res.write("\n\n[Citrus Bot streaming error. Please try again.]");
    res.end();
  }

  return undefined;
};

module.exports = {
  chatWithAI,
  chatWithAIStream,
};
