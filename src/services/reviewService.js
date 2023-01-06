const config = require("config");
const axios = require("axios");
const logger = require("../common/logger");

const { getM2Mtoken } = require("../common/helper");

const MAX_REVIEWS_TO_GET = 500;
const PASS_THRESHOLD = config.get("AUTOMATED_GRADING_PASS_THRESHOLD");

async function getReviewTypeId(name) {
  const authToken = await getM2Mtoken();

  const requestConfig = {
    method: "get",
    url: `${config.get("REVIEW_TYPES_API_V5")}?name=${name}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };

  try {
    const response = await axios(requestConfig);
    const reviewTypes = response.data;
    logger.info(`ReviewTypes: ${JSON.stringify(reviewTypes)}`);
    return reviewTypes != null && reviewTypes.length > 0
      ? reviewTypes[0].id
      : null;
  } catch (err) {
    logger.error(
      `Failed to get Review Type ID with error ${JSON.stringify(err)}`
    );

    return null;
  }
}

async function getReviews(status, typeId, updateThreshold, pageNo = 1) {
  const authToken = await getM2Mtoken();

  logger.debug(`Fetching reviews: Page No: ${pageNo}`);

  const passingSubmissions = [];
  const apiEndpoint = config.get("REVIEWS_API_V5");
  const requestConfig = {
    method: "get",
    url: `${apiEndpoint}?status=${status}&typeId=${typeId}&page=${pageNo}&perPage=${MAX_REVIEWS_TO_GET}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };

  try {
    const response = await axios(requestConfig);
    const reviews = response.data;
    for (let review of reviews) {
      if (new Date(review.updated).getTime() < updateThreshold) {
        logger.info(
          `Skipping remaining challenges as submission before threshold: ${updateThreshold}`
        );
        return passingSubmissions;
      }
      if (review.score >= PASS_THRESHOLD) {
        logger.info(
          `Skipping submission ${review.submissionId} as its score ${review.score} is below threshold.`
        );
        passingSubmissions.push(review.submissionId);
      }
    }
  } catch (err) {
    return passingSubmissions;
  }

  const nextPageReviews = await getReviews(
    status,
    typeId,
    updateThreshold,
    pageNo + 1
  );

  return passingSubmissions.concat(nextPageReviews);
}

module.exports = {
  getReviewTypeId,
  getReviews,
};
