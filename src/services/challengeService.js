const config = require("config");
const axios = require("axios");
const logger = require("../common/logger");

async function getChallengeTags(id) {
  const apiBaseUrl = config.get("CHALLENGE_API_V5");
  const requestConfig = {
    method: "get",
    url: `${apiBaseUrl}/${id}`,
  };

  try {
    logger.debug(`Getting challenge tags for challenge ${id}`);
    const response = await axios(requestConfig);
    const challenge = response.data;

    const tags = challenge != null ? challenge.tags : null;

    return tags;
  } catch (err) {
    return null;
  }
}

module.exports = {
  getChallengeTags,
};
