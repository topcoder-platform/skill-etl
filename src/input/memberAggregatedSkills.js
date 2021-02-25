/**
 * This file defines methods for querying member entered input from DynamoDB.
 */

const _ = require('underscore')
const logger = require('../common/logger')
const { MemberAggregatedSkills } = require('../common/dynamodb')

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

module.exports = {
  getMemberAggregatedSkills,
};
