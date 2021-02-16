const logger = require('../src/common/logger')
const { MemberEnteredSkills, MemberAggregatedSkills, ExternalsStackoverflow } = require('../src/common/dynamodb')

async function deleteTables () {
  const tablesToDelete = [MemberEnteredSkills, MemberAggregatedSkills, ExternalsStackoverflow]
  for (const table of tablesToDelete) {
    const name = table.tableName()
    logger.info(`Deleting table ${name}.`)
    try {
      await table.deleteTable()
      logger.info(`Deleted table ${name}`)
    } catch (err) {
      logger.warn(`Failed to delete table ${name}, ${err}.`)
    }
  }
}

deleteTables()
  .then(() => logger.info('done'))
  .catch((err) => logger.error(err))
