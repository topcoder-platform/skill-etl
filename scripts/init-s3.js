/**
 * Script to initialize the local DynamoDB.
 */

const fs = require('fs')
const path = require('path')
const config = require('config')
const AWS = require('aws-sdk')
const logger = require('../src/common/logger')

const s3 = config.get('S3.useLocal') === 'true' ? new AWS.S3({ endpoint: config.get('S3.endpoint'), s3ForcePathStyle: true }) : new AWS.S3()

async function main () {
  logger.info('Creating bucket.')
  try {
    await s3.createBucket({ Bucket: config.get('S3.bucket') }).promise()
    logger.info('Successfully created bucket.')
  } catch (err) {
    logger.warn(`Failed to created bucket ${err}.`)
    throw err
  }

  logger.info('Uploading tagsMap file.')
  try {
    const fileStream = fs.createReadStream(path.join(__dirname, 'tagsMap.txt'))
    fileStream.on('error', function (err) {
      console.log('File Error', err)
    })
    await s3.upload({ Bucket: config.get('S3.bucket'), Key: config.get('S3.tagsMapKey'), Body: fileStream }).promise()
    logger.info('Successfully uploaded tagsMap file.')
  } catch (err) {
    logger.warn(`Failed to upload tagsMap file ${err}.`)
    throw err
  }
}

main()
  .then(() => logger.info('done'))
  .catch((err) => {
    logger.error(err)
    process.exit(1)
  })
