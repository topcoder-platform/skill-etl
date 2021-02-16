const _ = require('underscore')
const config = require('config')
const logger = require('./src/common/logger')
const tagsMap = require('./src/common/tagsMap')
const userChallengeSkills = require('./src/input/userChallengeSkills')
const memberEntered = require('./src/input/memberEnteredSkills')
const stackoverflow = require('./src/input/stackoverflowSkills')
const aggregatedSkills = require('./src/output/aggregatedSkills')

/**
 * Merge skills.
 * @param to
 * @param from
 * @returns {*}
 */
function mergeSkills (to, from) {
  _.forEach(from, (val, tagId) => {
    const dest = to[tagId]
    if (dest) {
      dest.sources = dest.sources.concat(val.sources)
      dest.hidden = dest.hidden || val.hidden
    } else {
      to[tagId] = val
    }
  })
  return to
}

async function main () {
  const tags = await tagsMap.loadTagsMap()
  logger.info(`Loaded ${Object.keys(tags).length} tags.`)

  const userSkills = await userChallengeSkills.getUserSkills(config.get('MAX_DAYS_FOR_CHALLENGE_SKILLS'), tags)
  for (const r of userSkills) {
    logger.debug(`Processing user skills for user: ${r.userId}.`)
    logger.debug(`User challenge skills: ${Object.keys(r.skills).length}.`)
    const enteredSkills = await memberEntered.getMemberEnteredSkills(r.userId)
    logger.debug(`User entered skills: ${Object.keys(enteredSkills).length}.`)
    r.skills = mergeSkills(r.skills, enteredSkills)
    logger.debug(`Updated skills: ${JSON.stringify(r.skills)}.`)

    const stackoverflowTags = await stackoverflow.getStackoverflowSkills(r.userId, tags)
    logger.debug(`External stackoverflow skills: ${Object.keys(stackoverflowTags).length}.`)
    r.skills = mergeSkills(r.skills, stackoverflowTags)
    logger.debug(`Updated skills: ${JSON.stringify(r.skills)}.`)
  }

  logger.info(`Writing ${userSkills.length} items to MemberAggregatedSkills table.`)
  await aggregatedSkills.writeAggregatedSkills(userSkills)
}

main().catch(err => console.error(err))
