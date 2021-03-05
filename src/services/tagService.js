const axios = require("axios");

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
      tagsMap[tags[t].name] = tags[t].id;
    }
    tagsMap = sortObject(tagsMap);
    return tagsMap
}

async function getTagsfromAPI() {
  const response = await axios.get(
    "https://api.topcoder.com/v3/tags/?filter=domain%3DSKILLS%26status%3DAPPROVED&limit=1000",
    { headers: { accept: "*/*", "accept-language": "en-US,en;q=0.9,la;q=0.8", "content-type": "application/json", "sec-fetch-dest": "empty", "sec-fetch-mode": "cors", "sec-fetch-site": "same-site", }, referrer: "https://www.topcoder.com/", referrerPolicy: "strict-origin-when-cross-origin", body: null, method: "GET", mode: "cors", credentials: "omit", }
  );
    const tags = response && response.data && response.data.result && response.data.result.content ? response.data.result.content : {};
    return tranformResponse(tags);
}

module.exports = {
  getTagsfromAPI,
};