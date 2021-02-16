/**
 * Script to initialize the local DynamoDB.
 */

const logger = require('../src/common/logger')
const { dynamo, MemberEnteredSkills, ExternalsStackoverflow } = require('../src/common/dynamodb')
const data = require('./dynamodb-data.json')

async function main () {
  logger.info('Creating tables.')
  try {
    await dynamo.createTables()
    logger.info('Successfully created tables.')
  } catch (err) {
    logger.warn(`Failed to created tables ${err}.`)
    throw err
  }

  for (const item of data.MemberEnteredSkills) {
    logger.info(`Creating MemberEnteredSkills record: ${JSON.stringify(item)}.`)
    try {
      const x = new MemberEnteredSkills(item)
      const saved = await x.save()
      logger.info(`Created MemberEnteredSkills record: ${JSON.stringify(saved)}.`)
    } catch (err) {
      logger.warn(`Failed to create MemberEnteredSkills record: ${err}.`)
      throw err
    }
  }
  for (const item of data.ExternalsStackoverflow) {
    logger.info(`Creating ExternalsStackoverflow record: ${JSON.stringify(item)}.`)
    try {
      const x = new ExternalsStackoverflow(item)
      const saved = await x.save()
      logger.info(`Created ExternalsStackoverflow record: ${JSON.stringify(saved)}.`)
    } catch (err) {
      logger.warn(`Failed to create ExternalsStackoverflow record: ${err}.`)
      throw err
    }
  }
}

main()
  .then(() => logger.info('done'))
  .catch((err) => {
    logger.error(err)
    process.exit(1)
  })
