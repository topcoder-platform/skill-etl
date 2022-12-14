/**
 * This file defines methods for querying member entered input from DynamoDB.
 */
var { DateTime } = require("luxon");
const logger = require("../common/logger");
const config = require("config");
const skillUpdater = require("../loaders/skilUpdater");

async function updateChallengeSkills(tags, challengeId) {
  const to = DateTime.now();
  const from = to.minus({ days: config.get("MAX_DAYS_FOR_CHALLENGE_SKILLS") });
  logger.debug(`Updating skills ${from.toISODate()} to ${to.toISODate()} `);
  await skillUpdater.updateSkills(from, to, tags, challengeId);
}

module.exports = {
  updateChallengeSkills,
};
