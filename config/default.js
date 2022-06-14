const path = require("path");

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || "debug",
  INFORMIX: {
    host: process.env.INFORMIX_HOST || "localhost",
    port: parseInt(process.env.INFORMIX_PORT || 9088, 10),
    user: process.env.INFORMIX_USER || "informix",
    password: process.env.INFORMIX_PASSWORD || "in4mix",
    database: process.env.INFORMIX_DATABASE || "tcs_dw",
    server: process.env.INFORMIX_SERVER || "informix",
    minpool: parseInt(process.env.MINPOOL, 10) || 1,
    maxpool: parseInt(process.env.MAXPOOL, 10) || 60,
    maxsize: parseInt(process.env.MAXSIZE, 10) || 0,
    idleTimeout: parseInt(process.env.IDLETIMEOUT, 10) || 3600,
    timeout: parseInt(process.env.TIMEOUT, 10) || 30000,
  },
  DYNAMODB: {
    endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
  },
  TAGS_API_V3:
    process.env.TAGS_API_V3 || "https://api.topcoder-dev.com/v3/tags",
  REVIEW_TYPES_API_V5:
    process.env.REVIEW_TYPES_API_V5 ||
    "https://api.topcoder-dev.com/v5/reviewTypes",
  REVIEWS_API_V5:
    process.env.REVIEWS_API_V5 || "https://api.topcoder-dev.com/v5/reviews",
  CHALLENGE_API_V5:
    process.env.CHALLENGE_API_V5 ||
    "https://api.topcoder-dev.com/v5/challenges",
  SUBMISSION_API_V5:
    process.env.SUBMISSION_API_V5 ||
    "https://api.topcoder-dev.com/v5/submissions",
  MAX_DAYS_FOR_CHALLENGE_SKILLS:
    parseInt(process.env.MAX_DAYS_FOR_CHALLENGE_SKILLS, 10) || 1,
  AUTOMATED_GRADING_PASS_THRESHOLD:
    process.env.AUTOMATED_GRADING_PASS_THRESHOLD || 80,
};
