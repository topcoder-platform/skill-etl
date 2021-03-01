/**
 * This file defines the methods used to extract user challenge input from Informix database.
 */

const _ = require('underscore')
const logger = require('../common/logger')
const { getConnection, executeQuery } = require('../common/informix')
const { SOURCES } = require('../common/constants')

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
async function getUserSkills(maxDaysBefore, tagsMap) {
  
  const USER_CHALLENGE_SKILL_QUERY = `SELECT  pr.user_id as userId,
        "ss" || pr.project_id as challengeId,
        pt.name as name, pr.review_complete_timestamp
        FROM tcs_dw:project_result pr
        INNER JOIN tcs_dw:project p ON p.project_id = pr.project_id
        INNER JOIN tcs_dw:project_technology pt ON pt.project_id = p.project_id
        WHERE pr.passed_review_ind = 1 AND pr.review_complete_timestamp > (CURRENT -  ${maxDaysBefore} UNITS DAY)`;

  const conn = await getConnection()
  try {    
    logger.info(`Query all challenge user skills, for last ${maxDaysBefore} days.`)
    const users = await executeQuery(conn, USER_CHALLENGE_SKILL_QUERY)
    logger.info(`Found ${users.length} users.`)
     return groupSkillsByUser(users);
  } finally {
    conn.disconnect()
  }
}

module.exports = {
  getUserSkills
}
