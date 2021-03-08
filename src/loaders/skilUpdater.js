const _ = require("underscore");
const userBatch = require("../services/userBatch");
var strLength = require("node-mb-string-size");
const logger = require("../common/logger");
const { MemberAggregatedSkills } = require("../models/dynamodb");
const {SOURCES} = require("../common/constants")
const prettier = require("prettier");

async function writeAggregatedSkills(skills) {
  if (!_.isEmpty(skills))
    for (const skill of skills) {
      const s = new MemberAggregatedSkills({
        userId: skill.userId,
        skills: JSON.stringify(skill.skills),
      });
      await s.update();
    }
}

function mergeChallengeSkills(existingSkills, newUserSkills, tagsMap) {
  let finalSkills = Object.assign({}, existingSkills);
  for (const tag of newUserSkills) {
    const tagId = tagsMap[tag];
    if (tagId) {
      let e = existingSkills ? existingSkills[tagId] : null;
      if (e) {
        e.sources = e.sources ? e.sources : [];
        const isSourceRepeating = e.sources.includes(SOURCES.CHALLENGE);
        if (isSourceRepeating) {
          //do not score for now
          //e.scoreV2 = (e.scoreV2 ? e.scoreV2 : 0) + 1;
        } else {
          e.sources = e.sources.concat(SOURCES.CHALLENGE);
        }
        e.sources = [...new Set(e.sources)];
        e.hidden = e.hidden;
        finalSkills[tagId] = e;
      } else {
        finalSkills[tagId] = {
          sources: [SOURCES.CHALLENGE],
          score: 1,
          hidden: false,
        };
        //finalSkills[tagId].name = tag;
      }
    }
  }
  return finalSkills;
}

async function getMemberAggregatedSkills(userId) {
  logger.info(`Querying MemberAggregatedSkills for userId=${userId}`);
  const rows = await MemberAggregatedSkills.getItems([userId]);
  let skills = {};
  if (rows && !_.isEmpty(rows)) {
    skills = JSON.parse(rows[0].attrs.skills);
    logger.info(`MemberAggregatedSkills item found ${userId}.`);
  } else {
    logger.info(`No MemberAggregatedSkills item found ${userId}`);
  }
  return skills;
}

async function updateSkills(batchStartDate, batchEndDate, tags) {    
    let userSkills = [];
    const MAX_BYTES = 1048576; // 1MB
    //const usersWithNewSkills = { 40623428: [ "docker", "aws", "node.js", "axure", "user experience (ux)", "express", ], 22778049: ["axure", "node.js", "user experience (ux)"], }; //, "88774597": [ ".net", ], "8547899": [ "servlet", "applet", "node.js", ], "10336829": [ ".net", ], "16096823": [ ".net", ], "40152905": [ ".net", ], "40153455": [ ".net", ], }
    //const usersWithNewSkills = { 40159097: ["api testing", "appium", "chatter"], 88774597: ["facebook", "chatter", "appium"] }; //, "88774597": [ ".net", ], "8547899": [ "servlet", "applet", "node.js", ], "10336829": [ ".net", ], "16096823": [ ".net", ], "40152905": [ ".net", ], "40153455": [ ".net", ], }
    const users = await userBatch.getUsersBatch(batchStartDate.toISODate(), batchEndDate.toISODate());
    logger.debug(`*******************************************`);
    logger.debug(`Updating batch starting from ${batchStartDate.toISODate()} to ${batchEndDate.toISODate()}`);
    logger.debug(`Found ${Object.keys(users).length} new users with updated skills.\n `)
    logger.debug(prettier.format(JSON.stringify(users), { semi: false, parser: "json" }) )  
  
    for (const id in users) {
        let updatedSkills = {}, 
        userId = parseInt(id);
        logger.debug(`Getting existing skills for user: ${userId}.`);
        const existingSkills = await getMemberAggregatedSkills(userId);
        logger.debug( `Updated ${Object.keys(updatedSkills).length} skills for ${userId}` );

        updatedSkills = mergeChallengeSkills(existingSkills, users[userId], tags);
    
        logger.debug(`\n------------------------------------------------------------------"`);
        
        if (!_.isEmpty(updatedSkills)) {
          userSkills.push({ userId: userId, skills: updatedSkills });
        }
      
        if (strLength(JSON.stringify(updateSkills)) > MAX_BYTES) {
            logger.info(`Writing records because there are more than ${MAX_BYTES} bytes in the array`);
            logger.info( `Writing ${userSkills.length} items to MemberAggregatedSkills table.` );
            logger.debug(JSON.stringify(userSkills));
            await writeAggregatedSkills(userSkills);
            userSkills = [];
        }
    }
    logger.info( `Writing rest of the ${userSkills.length} items of size ${strLength(JSON.stringify(userSkills))}` );
    logger.debug( prettier.format(JSON.stringify(userSkills), { semi: false, parser: "json" }) );
    await writeAggregatedSkills(userSkills);
}

module.exports = {
  updateSkills,
};
