/**
 * This file defines methods for querying member entered input from DynamoDB.
 */

const _ = require('underscore')
const logger = require('../common/logger')
const { MemberAggregatedSkills } = require('../models/dynamodb')
const userChallengeSkills = require('../services/userChallengeSkills')
const { SOURCES } = require("../common/constants");
const config = require("config");

async function writeAggregatedSkills(skills) {
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
        e.sources = e.sources?e.sources:[]
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
          hidden: false
        };
        //finalSkills[tagId].name = tag;
      }
    }
  }
  return finalSkills;
}

/**
 * Lookup and parse the input from MemberEnteredSkills table.
 * @param userId - userId to lookup.
 * @returns {Promise<Object>} a input object whose keys are skill id.
 */
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

async function updateChallengeSkills(tags) {
  //const usersWithNewSkills = { 40623428: [ "docker", "aws", "node.js", "axure", "user experience (ux)", "express", ], 22778049: ["axure", "node.js", "user experience (ux)"], }; //, "88774597": [ ".net", ], "8547899": [ "servlet", "applet", "node.js", ], "10336829": [ ".net", ], "16096823": [ ".net", ], "40152905": [ ".net", ], "40153455": [ ".net", ], }
  //const usersWithNewSkills = { 40159097: ["api testing", "appium", "chatter"], 88774597: ["facebook", "chatter", "appium"] }; //, "88774597": [ ".net", ], "8547899": [ "servlet", "applet", "node.js", ], "10336829": [ ".net", ], "16096823": [ ".net", ], "40152905": [ ".net", ], "40153455": [ ".net", ], }
  const usersWithNewSkills = await userChallengeSkills.getUserSkills(config.get("MAX_DAYS_FOR_CHALLENGE_SKILLS"), tags);
  let userSkills = [];
  if (usersWithNewSkills && usersWithNewSkills.length === 0) {
    logger.info(`No new users with updated skills.`);
    return;
  }
  logger.info( `Found ${ Object.keys(usersWithNewSkills).length } new users with updated skills.` );
  logger.debug( `Users with new skills:\n ${JSON.stringify(usersWithNewSkills)}.`);
  for (const id in usersWithNewSkills) {
    let updatedSkills = {},
    userId = parseInt(id);
    logger.debug(`Getting existing skills for user: ${userId}.`);
    const existingSkills = await getMemberAggregatedSkills(userId);
    logger.debug(`existingSkills:\n ${JSON.stringify(existingSkills)}.`);
    updatedSkills = mergeChallengeSkills(existingSkills, usersWithNewSkills[userId], tags);
    //logger.debug(`Processing user skills for user: ${userId}.`);
    //logger.debug(`User challenge skills: ${Object.keys(r.skills).length}.`);

    logger.debug(`Updated skills:\n ${JSON.stringify(updatedSkills)}.`);
    logger.debug(
      `\n------------------------------------------------------------------"`
    );
    userSkills.push({ userId: userId, skills: updatedSkills });
  }

  logger.info(
    `Writing ${userSkills.length} items to MemberAggregatedSkills table.`
  );
  logger.debug(
    `\n----------------------- final skills -------------------------------------------"`
  );
  logger.debug(JSON.stringify(userSkills));
  await writeAggregatedSkills(userSkills);
}

module.exports = {
  getMemberAggregatedSkills,
  updateChallengeSkills,
};
