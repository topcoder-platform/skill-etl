/**
 * This file defines methods used to connect to Informix database and execute queries.
 */

const config = require('config')
const InformixWrapper = require('informix-wrapper')
const logger = require('./logger')

/**
 * Get a connection to the database.
 * @returns {Promise<JDBCConnection>} a connection to the informix database.
 */
async function getConnection () {
  return new Promise((resolve, reject) => {
    logger.debug('Acquiring Informix Connection')
    const conn = new InformixWrapper(config.get('INFORMIX'), logger.debug.bind(logger))
    conn.on('error', (err) => {
      conn.disconnect()
      reject(err)
    })
    conn.initialize()
    conn.connect((err) => {
      if (err) {
        reject(err)
      } else {
        resolve(conn)
        logger.debug('Aquired Informix Connection')
      }
    })
  })
}

/**
 * Execute a query on a database connection.
 * @param c - connection returned by getConnection function.
 * @param sql - query.
 * @param params - query params array, [{type, value}].
 * @returns {Promise<[*]>}
 */
async function executeQuery (c, sql, params) {
  logger.debug('******** SQL *********')
  logger.debug(sql)
  logger.debug(params)
  return new Promise((resolve, reject) => {
    c.executePreparedQuery(sql, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    }, params)
  })
}

module.exports = {
  getConnection,
  executeQuery
}
