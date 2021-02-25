const _ = require('underscore')
const config = require('config')
const logger = require('./src/common/logger')
const tagsMap = require('./src/common/tagsMap')
const userChallengeSkills = require('./src/input/userChallengeSkills')
const memberEntered = require('./src/input/memberEnteredSkills')
const stackoverflow = require('./src/input/stackoverflowSkills')
const aggregatedSkills = require('./src/output/aggregatedSkills')
const memberAggregatedSkills = require("./src/input/memberAggregatedSkills");
const { SOURCES } = require("./src/common/constants");

/**
 * Merge skills.
 * @param to
 * @param from
 * @returns {*}
 */
function mergeSkills(to, from) {

  _.forEach(from, (val, tagId) => {
   // if the skill already exists 
    const dest = to[tagId]
    if (dest) {
      debugger;
      dest.sources = dest.sources.concat(val.sources)
      dest.hidden = dest.hidden || val.hidden      
    } else {
      // if the skill is new
      to[tagId] = val
    }
  })
  return to
}

function mergeChallengeSkills(existingSkills, newUserSkills, tagsMap) {
  let finalSkills = Object.assign({}, existingSkills);

  for (const tag of newUserSkills) {
    const tagId = tagsMap[tag];
    let e = existingSkills ? existingSkills[tagId] : null;
    if (e) {
      const isSourceRepeating = SOURCES.CHALLENGE.localeCompare(e.sources) === 0;
      if (isSourceRepeating) {
        e.scoreV2 = (e.scoreV2 ? e.scoreV2 : 0) + 1;
      } else {
        e.sources = e.sources.concat(e.sources);
      }
      e.hidden = e.hidden;
      finalSkills[tagId] = e;
    } else {
      finalSkills[tagId] = {
        sources: [SOURCES.CHALLENGE],
        score: 1,
        hidden: false,
        scoreV2: 1,
      };
      finalSkills[tagId].name = tag;
    }
  }
  return finalSkills;
}

function mergeUserEnteredSkills(existingSkills, enteredSkills) {
  let finalSkills = Object.assign({}, existingSkills);
  for (const tagId in enteredSkills) {
    let skill = existingSkills[tagId];
    if (!skill) {
      finalSkills[tagId] = enteredSkills[tagId];
    }
  }
  return finalSkills;
}

//const usersWithNewSkills = { "114853": [ ".net", ], "251184": [ ".net", ], "8547899": [ "servlet", "applet", "node.js", ], "10336829": [ ".net", ], "16096823": [ ".net", ], "40152905": [ ".net", ], "40153455": [ ".net", ], }

async function main () {
  const tags = await tagsMap.loadTagsMap();
  let userSkills = [];
  logger.info(`Loaded ${Object.keys(tags).length} tags.`);
  debugger;
  const usersWithNewSkills = await userChallengeSkills.getUserSkills(config.get('MAX_DAYS_FOR_CHALLENGE_SKILLS'), tags)

  for (const id in usersWithNewSkills) {
    let updatedSkills = {},
      userId = parseInt(id);
    logger.debug(`Getting existing skills for user: ${userId}.`);
    const existingSkill = await memberAggregatedSkills.getMemberAggregatedSkills(
      userId
    );
    updatedSkills = mergeChallengeSkills(
      existingSkill,
      usersWithNewSkills[userId],
      tags
    );
    //logger.debug(`Processing user skills for user: ${userId}.`);
    //logger.debug(`User challenge skills: ${Object.keys(r.skills).length}.`);
    const userEnteredSkills = await memberEntered.getMemberEnteredSkills(
      userId
    );
    //logger.debug(`User entered skills:\n ${Object.keys(userEnteredSkills).length}.`);
    //r.skills = mergeSkills(r.skills, enteredSkills);
    updatedSkills = mergeUserEnteredSkills(updatedSkills, userEnteredSkills);
    logger.debug(`Updated skills:\n ${JSON.stringify(updatedSkills)}.`);
    logger.debug(
      `\n------------------------------------------------------------------"`
    );
    userSkills.push({
      userId: userId,
      skills: updatedSkills,
    });
    /* const stackoverflowTags = await stackoverflow.getStackoverflowSkills(r.userId,tags);
     logger.debug(`External stackoverflow skills: ${Object.keys(stackoverflowTags).length}.`);
     r.skills = mergeSkills(r.skills, stackoverflowTags);
     logger.debug(`Updated skills: ${JSON.stringify(r.skills)}.`);*/
  }

  logger.info(
    `Writing ${userSkills.length} items to MemberAggregatedSkills table.`
  );

  console.log(
    `\n----------------------- final skills -------------------------------------------"`
  );
  console.log(JSON.stringify(userSkills));
  await aggregatedSkills.writeAggregatedSkills(userSkills)
}

main().catch(err => console.error(err))
