const logger = require('./src/common/logger')
const tagsMap = require('./src/common/tagsMap')
const {updateUserEnteredSkills} = require('./src/loaders/memberEnteredSkills')
const {updateStackOverflowSkills} = require('./src/loaders/stackoverflowSkills')
const {updateChallengeSkills} = require("./src/loaders/memberAggregatedSkills");

async function main () {
  const tags = await tagsMap.loadTagsMap();  
  logger.info(`Loaded ${Object.keys(tags).length} tags.`);
  updateChallengeSkills(tags);
}

main().catch(err => console.error(err))
