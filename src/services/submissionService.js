const config = require("config");
const axios = require("axios");
const logger = require("../common/logger");
const { getM2Mtoken } = require("../common/helper");

async function getChallengeIdForSubmission(id) {
  const apiBaseUrl = config.get("SUBMISSION_API_V5");
  const authToken = await getM2Mtoken();

  const requestConfig = {
    url: `${apiBaseUrl}/${id}`,
    method: "get",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };

  try {
    logger.debug(`Getting challengeId for submission ${id}`);
    const response = await axios(requestConfig);
    const submission = response.data;

    if (submission == null) return null;

    return {
      challengeId: submission.v5ChallengeId,
      memberId: submission.memberId,
    };
  } catch (err) {
    logger.error(
      `Something went wrong when getting submission ${JSON.stringify(err)}`
    );
    return null;
  }
}

module.exports = {
  getChallengeIdForSubmission,
};
