const _ = require('underscore')
const config = require('config')
const csv = require('csv-parser')
const AWS = require('aws-sdk')
const logger = require('./logger')

const s3 = config.get('S3.useLocal') === 'true' ? new AWS.S3({ endpoint: config.get('S3.endpoint'), s3ForcePathStyle: true }) : new AWS.S3()

/**
 * Load tags map, from skill name/synonyms to skill id.
 * @returns {Promise<unknown>}
 */
async function loadTagsMap () {
  return new Promise((resolve, reject) => {
    const results = {}
    logger.info(`Loading tags map from s3 bucket: ${config.get('S3.bucket')}, key: ${config.get('S3.tagsMapKey')}`)
    s3.getObject({ Key: config.get('S3.tagsMapKey'), Bucket: config.get('S3.bucket') })
      .createReadStream()
      .pipe(csv({ separator: '|', headers: ['key', 'name', 'aliases'] }))
      .on('data', (data) => {
        logger.debug(`Skill Id: ${data.key}, Name: ${data.name}.`)
        results[data.name.toLowerCase()] = data.key
        if (data.aliases && !_.isEmpty(data.aliases)) {
          const names = JSON.parse(data.aliases)
          for (const name of names) {
            logger.debug(`Skill Id: ${data.key}, Synonym: ${data.name}.`)
            results[name.toLowerCase()] = data.key
          }
        }
      })
      .on('end', () => {
        logger.info(`Loaded tags map from s3 bucket: ${config.get('S3.bucket')}, key: ${config.get('S3.tagsMapKey')}`)
        resolve(results)
      })
      .on('error', (err) => {
        logger.logFullError(err)
        reject(err)
      })
  })
}

module.exports = {
  loadTagsMap
}
