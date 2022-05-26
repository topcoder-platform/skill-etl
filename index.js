const logger = require('./src/common/logger')
const tagsMap = require('./src/services/tagService')
const {updateChallengeSkills} = require("./src/loaders/memberAggregatedSkills");

async function main () {
  const tags = await tagsMap.getTagsfromAPI();  
  logger.info(`Loaded ${Object.keys(tags).length} tags.`);
  updateChallengeSkills(tags);
}

main().catch(err => console.error(err))
