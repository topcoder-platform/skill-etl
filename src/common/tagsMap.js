const _ = require('underscore')
const config = require('config')
const csv = require('csv-parser')
const fs = require('fs')
const logger = require('./logger')

/**
 * Load tags map, from skill name/synonyms to skill id.
 * @returns {Promise<unknown>}
 */
async function loadTagsMap () {
  return new Promise((resolve, reject) => {
    const results = {}
    const tagsMapFile = config.get('TAGS_MAP_FILE')
    logger.info(`Loading tags map from ${tagsMapFile}.`)
    fs.createReadStream(tagsMapFile)
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
        logger.info(`Loaded tags map from ${tagsMapFile}`)
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
