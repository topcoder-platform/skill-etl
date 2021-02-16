/**
 * This file defines methods for writing the aggregated skills to DynamoDB table.
 */

const { MemberAggregatedSkills } = require('../common/dynamodb')

async function writeAggregatedSkills (skills) {
  for (const skill of skills) {
    const s = new MemberAggregatedSkills({ userId: skill.userId, skills: JSON.stringify(skill.skills) })
    await s.save()
  }
}

module.exports = {
  writeAggregatedSkills
}
