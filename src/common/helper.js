const _ = require("lodash");
const config = require("config");
const m2mAuth = require("tc-core-library-js").auth.m2m;

const m2m = m2mAuth(
  _.pick(config, ["AUTH0_URL", "AUTH0_AUDIENCE", "AUTH0_PROXY_SERVER_URL"])
);

async function getM2Mtoken() {
  return m2m.getMachineToken(
    config.get("AUTH0_CLIENT_ID"),
    config.get("AUTH0_CLIENT_SECRET")
  );
}

module.exports = {
  getM2Mtoken,
};
