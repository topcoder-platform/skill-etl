/**
 * This file defines the methods used to extract user challenge input from Informix database.
 */

const _ = require('underscore')
const logger = require('../common/logger')
const { getConnection, executeQuery } = require('../common/informix')
const { SOURCES } = require('../common/constants')

/**
 * Convert challenge skill object {userid, challengeid, name} to mapped skill object.
 * @param challengeSkill
 * @param tagsMap
 * @returns {{skills: {}, userId: *}}
 */
function toMappedSkill(challengeSkill, tagsMap) { 
  //logger.debug(tagsMap)
  //debugger;
  const skillsName = challengeSkill.name.toLowerCase();
  logger.debug("skillsName : " + skillsName)  
  // tagsMap = JSON.parse(tagsMap);
  //logger.debug(typeof tagsMap)
  //logger.debug(JSON.stringify(tagsMap));
  const tagId = tagsMap[skillsName];

  //const { [skillsName]: key } = tagsMap; 
  logger.debug("tagId : " + tagId);
 
  if (tagId) {
     return {
       userId: challengeSkill.userid,
       skills: {
         [tagId]: {
           sources: [SOURCES.CHALLENGE],
           hidden: false,
           score: 1.0,
           skillsName: skillsName,
         },
       },
     };
  }
}

/**
 * SQL query to select user challenge input.
 * @type {string}
 */
const USER_CHALLENGE_SKILL_QUERY = `SELECT  pr.user_id as userId,
        "ss" || pr.project_id as challengeId,
        pt.name as name, pr.review_complete_timestamp
        FROM tcs_dw:project_result pr
        INNER JOIN tcs_dw:project p ON p.project_id = pr.project_id
        INNER JOIN tcs_dw:project_technology pt ON pt.project_id = p.project_id
        WHERE pr.passed_review_ind = 1 AND pr.review_complete_timestamp > (CURRENT -  500 UNITS DAY)`;

function groupSkillsByUser(users) {
  let grouped = {};
  let name = "";
  for (const u of users) {
    name = u.name.toLowerCase();
    if (grouped[u.userid]) {
      grouped[u.userid].push(name);
    } else {
      grouped[u.userid] = [name];
    }
  }
  return grouped;
}

/**
 * Query user challenge input.
 * @param maxDaysBefore - only fetch the input where project_result.review_complete_timestamp is within the given days in the past.
 * @param tagsMap - tags map to map skill name to skill id.
 * @returns {Promise<[*]>}
 */
async function getUserSkills (maxDaysBefore, tagsMap) {
  const conn = await getConnection()
  try {    
    const date = 3;//new Date(new Date().getTime() - maxDaysBefore * 24 * 3600 * 1000).toISOString().replace(/Z$/, '+0000')
    logger.info(`Query all challenge user skills from ${date}.`)
    const users = await executeQuery(conn, USER_CHALLENGE_SKILL_QUERY)
    logger.info(`Found ${users.length} users.`)
    //const skills = _.filter(_.map(users, user => toMappedSkill(user, tagsMap)), mapped => _.isObject(mapped))
    return groupSkillsByUser(users);
  } finally {
    conn.disconnect()
  }
}

module.exports = {
  getUserSkills
}
