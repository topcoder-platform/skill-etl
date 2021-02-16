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
function toMappedSkill (challengeSkill, tagsMap) {
  const tagId = tagsMap[challengeSkill.name.toLowerCase()]
  if (tagId) {
    return {
      userId: challengeSkill.userid,
      skills: {
        [tagId]: {
          sources: [SOURCES.CHALLENGE],
          hidden: false,
          score: 1.0
        }
      }
    }
  }
}

/**
 * SQL query to select user challenge input.
 * @type {string}
 */
const USER_CHALLENGE_SKILL_QUERY =
  `SELECT first 100 *
   FROM (SELECT ps.coder_id as userId,
                "srm" || ps.round_id as challengeId,
                ll.language_name as name
         FROM topcoder_dw:problem_submission ps
         INNER JOIN topcoder_dw:language_lu ll ON ll.language_id = ps.language_id AND ll.language_name != 'Unspecified'
         UNION ALL
         SELECT ps.coder_id as userId,
                "srm" || ps.round_id as challengeId,
                pclu.problem_category_desc as name
         FROM topcoder_dw:problem_submission ps
         INNER JOIN topcoder_dw:problem_category_xref pcxref ON pcxref.problem_id = ps.problem_id
         INNER JOIN topcoder_dw:problem_category_lu pclu ON pclu.problem_category_id = pcxref.problem_category_id
         UNION ALL
         SELECT lps.coder_id as userId,
                "mm" || lps.round_id as challengeId,
                ll.language_name as name
         FROM topcoder_dw:long_problem_submission lps
         INNER JOIN topcoder_dw:language_lu ll ON ll.language_id = lps.language_id AND ll.language_name != 'Unspecified'
         UNION ALL
         SELECT lps.coder_id as userId,
                "mm" || lps.round_id as challengeId,
                pclu.problem_category_desc as name
         FROM topcoder_dw:long_problem_submission lps
         INNER JOIN topcoder_dw:problem_category_xref pcxref ON pcxref.problem_id = lps.problem_id
         INNER JOIN topcoder_dw:problem_category_lu pclu ON pclu.problem_category_id = pcxref.problem_category_id
         UNION ALL
         SELECT pr.user_id as userId,
                "ss" || pr.project_id as challengeId,
                pt.name as name
         FROM tcs_dw:project_result pr
         INNER JOIN tcs_dw:project p ON p.project_id = pr.project_id
         INNER JOIN tcs_dw:project_technology pt ON pt.project_id = p.project_id
         WHERE pr.passed_review_ind = 1 AND pr.review_complete_timestamp > ?)`

/**
 * Query user challenge input.
 * @param maxDaysBefore - only fetch the input where project_result.review_complete_timestamp is within the given days in the past.
 * @param tagsMap - tags map to map skill name to skill id.
 * @returns {Promise<[*]>}
 */
async function getUserSkills (maxDaysBefore, tagsMap) {
  const conn = await getConnection()
  try {
    const date = new Date(new Date().getTime() - maxDaysBefore * 24 * 3600 * 1000).toISOString().replace(/Z$/, '+0000')
    logger.info(`Query all challenge user skills from ${date}.`)
    const users = await executeQuery(conn, USER_CHALLENGE_SKILL_QUERY, [{ type: 'date', value: date }])
    logger.info(`Found ${users.length} users.`)
    return _.filter(_.map(users, user => toMappedSkill(user, tagsMap)), mapped => _.isObject(mapped))
  } finally {
    conn.disconnect()
  }
}

module.exports = {
  getUserSkills
}
