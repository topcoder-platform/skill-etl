/**
 * This file defines methods for querying member entered input from DynamoDB.
 */

const _ = require('underscore')
const logger = require('../common/logger')
const { MemberEnteredSkills } = require('../common/dynamodb')
const { SOURCES } = require('../common/constants')

/**
 * Lookup and parse the input from MemberEnteredSkills table.
 * @param userId - userId to lookup.
 * @returns {Promise<Object>} a input object whose keys are skill id.
 */
async function getMemberEnteredSkills (userId) {
  logger.info(`Querying MemberEnteredSkills for userId=${userId}`)
  const rows = await MemberEnteredSkills.getItems([userId])
  let skills = {}

  if (rows && !_.isEmpty(rows)) {
    skills = JSON.parse(rows[0].attrs.skills)
    logger.info(`MemberEnteredSkills item found ${userId}.`)
  } else {
    logger.info(`No MemberEnteredSkills item found ${userId}`)
  }
  return _.mapObject(skills, (val, key) => {
    return { sources: [SOURCES.USER_ENTERED], score: 1.0, hidden: val.hidden }
  })
}

module.exports = {
  getMemberEnteredSkills
}
