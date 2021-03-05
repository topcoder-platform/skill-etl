const userBatch = require("../services/userBatch");
var strLength = require("node-mb-string-size");
const { getMemberAggregatedSkills,mergeChallengeSkills } = require("../loaders/memberAggregatedSkills");
const logger = require("../common/logger");
const { MemberAggregatedSkills } = require("../models/dynamodb");

async function writeAggregatedSkills(skills) {
  for (const skill of skills) {
    const s = new MemberAggregatedSkills({
      userId: skill.userId,
      skills: JSON.stringify(skill.skills),
    });
    await s.update();
  }
}

async function updateSkills(batchStartDate, batchEndDate, tags) {
    let userSkills = [];
    const MAX_BYTES = 1048576; // 1MB
    const users = await userBatch.getUsersBatch(batchStartDate.toISODate(), batchEndDate.toISODate());
    logger.debug(`*******************************************`);
    logger.debug(`Updating batch starting from ${batchStartDate.toISODate()} to ${batchEndDate.toISODate()}`);
    logger.debug(users);
    logger.debug(`Found ${Object.keys(users).length} new users with updated skills.`);
    for (const id in users) {
        let updatedSkills = {}, 
        userId = parseInt(id);
        logger.debug(`Getting existing skills for user: ${userId}.`);
        const existingSkills = await getMemberAggregatedSkills(userId);
        logger.debug( `Updated ${Object.keys(updatedSkills).length} skills for ${userId}` );

        updatedSkills = mergeChallengeSkills(existingSkills, users[userId], tags);
    
        logger.debug(`\n------------------------------------------------------------------"`);
        userSkills.push({ userId: userId, skills: updatedSkills });
        if (strLength(JSON.stringify(updateSkills)) > MAX_BYTES) {
            logger.info(`Writing records because there are more than ${MAX_BYTES} bytes in the array`);
            logger.info( `Writing ${userSkills.length} items to MemberAggregatedSkills table.` );
            //logger.debug(JSON.stringify(userSkills));

            //await writeAggregatedSkills(userSkills);
            userSkills = [];
        }
    }
    logger.info( `Writing rest of the ${userSkills.length} items of size ${strLength(JSON.stringify(userSkills))}` );
    //logger.debug(JSON.stringify(userSkills));
 // await writeAggregatedSkills(userSkills);
}

module.exports = {
  updateSkills,
};
