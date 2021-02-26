/**
 * This file defines methods for querying external stackoverflow data from DynamoDB.
 */

const _ = require('underscore')
const logger = require('../common/logger')
const { SOURCES } = require('../common/constants')
const { ExternalsStackoverflow } = require('../models/dynamodb')

/**
 * Convert a list of tags to a skills object, with tagId as keys.
 * @param tags
 * @param tagsMap
 * @returns {{}}
 */
function toMappedSkills (tags, tagsMap) {
  const skills = {}
  for (const tag of tags) {
    const tagId = tagsMap[tag.toLowerCase()]
    if (tagId) {
      skills[tagId] = {
        sources: [SOURCES.EXTERNAL_STACKOVERFLOW],
        hidden: false,
        score: 1.0
      }
    }
  }
  return skills
}

/**
 * Query and parse top tags from ExternalsStackoverflow table.
 * @param userId - id of the user to lookup.
 * @param tagsMap - tags map
 * @returns {Promise<{}>} a list of tags.
 */
async function getStackoverflowSkills (userId, tagsMap) {
  const rows = await ExternalsStackoverflow.getItems([userId])
  let tags = []
  if (rows && !_.isEmpty(rows)) {
    logger.info(`ExternalsStackoverflow itme found ${userId}`)
    tags = rows[0].attrs.topTags.split(',')
  } else {
    logger.info(`No ExternalsStackoverflow item found ${userId}`)
  }
  return toMappedSkills(tags, tagsMap)
}

function updateStackOverflowSkills(tags) {
  /* const stackoverflowTags = await stackoverflow.getStackoverflowSkills(r.userId,tags);
     logger.debug(`External stackoverflow skills: ${Object.keys(stackoverflowTags).length}.`);
     r.skills = mergeSkills(r.skills, stackoverflowTags);
     logger.debug(`Updated skills: ${JSON.stringify(r.skills)}.`);*/
}

module.exports = {
  getStackoverflowSkills,
  updateStackOverflowSkills,
};
