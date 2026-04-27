const createEmbedding = async (text) => {
  const value = String(text || "").trim();
  if (!value) return [];

  // Deterministic lightweight vector placeholder for Phase 1.
  // Replace this with a real embedding provider in Phase 2.
  const dimensions = 32;
  const vector = new Array(dimensions).fill(0);

  for (let index = 0; index < value.length; index += 1) {
    const bucket = index % dimensions;
    vector[bucket] += value.charCodeAt(index) / 255;
  }

  return vector.map((item) => Number((item / Math.max(1, value.length)).toFixed(6)));
};

module.exports = {
  createEmbedding,
};
