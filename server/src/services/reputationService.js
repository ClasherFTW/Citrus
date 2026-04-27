const User = require("../models/User");

const applyReputationDelta = async (userId, delta) => {
  if (!delta) return null;

  const user = await User.findById(userId);
  if (!user) return null;

  user.reputation = Math.max(0, user.reputation + delta);
  await user.save();

  return user.reputation;
};

module.exports = {
  applyReputationDelta,
};
