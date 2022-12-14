const logger = require("./src/common/logger");
const tagsMap = require("./src/services/tagService");
const {
  updateChallengeSkills,
} = require("./src/loaders/memberAggregatedSkills");

async function main() {
  // get challengeId from argument
  const challengeIndex = process.argv.indexOf('--challengeId');
  let challengeId;
  if (challengeIndex < 0) {
    throw new Error('no challengeId value found')
  } else {
    challengeId = process.argv[challengeIndex + 1];
  }

  const tags = await tagsMap.getTagsfromAPI();
  logger.info(`Loaded ${Object.keys(tags).length} tags.`);
  updateChallengeSkills(tags, challengeId);
}

main().catch((err) => console.error(err));
