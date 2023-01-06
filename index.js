const logger = require("./src/common/logger");
const tagsMap = require("./src/services/tagService");
const {
  updateChallengeSkills,
} = require("./src/loaders/memberAggregatedSkills");

async function main() {
  // get challengeId from env
  challengeId = process.env.CHALLENGE_ID
  if (!challengeId) throw new Error('No Challenge ID Provided')

  const tags = await tagsMap.getTagsfromAPI();
  logger.info(`Loaded ${Object.keys(tags).length} tags.`);
  updateChallengeSkills(tags, challengeId);
}

main().catch((err) => console.error(err));
