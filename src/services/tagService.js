const axios = require("axios");
const config = require("config");
const logger = require("../common/logger");

function sortObject(src) {
  var out;
  if (typeof src === "object" && Object.keys(src).length > 0) {
    out = {};
    Object.keys(src)
      .sort()
      .forEach(function (key) {
        out[key] = sortObject(src[key]);
      });
    return out;
  }
  return src;
}

function tranformResponse(tags) {
  let tagsMap = {};
  for (const t in tags) {
    tagsMap[tags[t].name.toLowerCase()] = tags[t].id;
  }
  tagsMap = sortObject(tagsMap);
  return tagsMap;
}

async function getTagsfromAPI() {
  const API_ENDPOINT = config.get("TAGS_API_V3"),
    API_PARAMS = "/?filter=domain%3DSKILLS%26status%3DAPPROVED&limit=1000",
    REQUEST_URL = API_ENDPOINT.concat(API_PARAMS);
  logger.debug(`Fetching Tags from ${REQUEST_URL}`);

  const response = await axios.get(REQUEST_URL, {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,la;q=0.8",
      "content-type": "application/json",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
    },
    referrer: "https://www.topcoder.com/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "omit",
  });
  const tags =
    response &&
    response.data &&
    response.data.result &&
    response.data.result.content
      ? response.data.result.content
      : {};
  return tranformResponse(tags);
}

module.exports = {
  getTagsfromAPI,
};
