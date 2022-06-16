/**
 * This file list the aggregated skills from DynamoDB
 */

const logger = require('../src/common/logger')
const { MemberAggregatedSkills } = require('../src/models/dynamodb')

MemberAggregatedSkills.scan().loadAll().exec((err, data) => {
  if (err) {
    logger.logFullError(err)
  } else {
    for (const item of data.Items) {
      logger.info(JSON.stringify(item))
    }
  }
})
