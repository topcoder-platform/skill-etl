const path = require('path')

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  INFORMIX: {
    host: process.env.INFORMIX_HOST || 'localhost',
    port: parseInt(process.env.INFORMIX_PORT || 9088, 10),
    user: process.env.INFORMIX_USER || 'informix',
    password: process.env.INFORMIX_PASSWORD || 'in4mix',
    database: process.env.INFORMIX_DATABASE || 'tcs_dw',
    server: process.env.INFORMIX_SERVER || 'informix',
    minpool: parseInt(process.env.MINPOOL, 10) || 1,
    maxpool: parseInt(process.env.MAXPOOL, 10) || 60,
    maxsize: parseInt(process.env.MAXSIZE, 10) || 0,
    idleTimeout: parseInt(process.env.IDLETIMEOUT, 10) || 3600,
    timeout: parseInt(process.env.TIMEOUT, 10) || 30000
  },
  DYNAMODB: {
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
    region: process.env.AWS_REGION || 'fake-region',
  },
  TAGS_MAP_FILE: process.env.TAGS_MAP_FILE || path.join(__dirname, '../data/tagsMap.txt'),
  MAX_DAYS_FOR_CHALLENGE_SKILLS: parseInt(process.env.MAX_DAYS_FOR_CHALLENGE_SKILLS, 10) || 1
}
