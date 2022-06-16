const _ = require("underscore");
const config = require("config");
const prettier = require("prettier");
const strLength = require("node-mb-string-size");

const userBatch = require("../services/userBatch");
const logger = require("../common/logger");

const reviewService = require("../services/reviewService");
const submissionService = require("../services/submissionService");
const challengeService = require("../services/challengeService");

const { MemberAggregatedSkills } = require("../models/dynamodb");
const { SOURCES } = require("../common/constants");

async function writeAggregatedSkills(skills) {
  if (!_.isEmpty(skills))
    for (const skill of skills) {
      const s = new MemberAggregatedSkills({
        userId: skill.userId,
        skills: JSON.stringify(skill.skills),
      });
      await s.update();
    }
}

function mergeChallengeSkills(existingSkills, newUserSkills, tagsMap) {
  logger.info(
    `Merging existing skills ${JSON.stringify(
      existingSkills
    )} with new skills ${newUserSkills}`
  );
  logger.info(`Tags Map ${JSON.stringify(tagsMap)}`);
  let finalSkills = Object.assign({}, existingSkills);
  for (const tag of newUserSkills) {
    const tagId = tagsMap[tag.trim().toLowerCase()];
    if (tagId) {
      let e = existingSkills ? existingSkills[tagId] : null;
      if (e) {
        e.sources = e.sources ? e.sources : [];
        const isSourceRepeating = e.sources.includes(SOURCES.CHALLENGE);
        if (isSourceRepeating) {
          //do not score for now
          //e.scoreV2 = (e.scoreV2 ? e.scoreV2 : 0) + 1;
        } else {
          e.sources = e.sources.concat(SOURCES.CHALLENGE);
        }
        e.sources = [...new Set(e.sources)];
        e.hidden = e.hidden;
        finalSkills[tagId] = e;
      } else {
        finalSkills[tagId] = {
          sources: [SOURCES.CHALLENGE],
          score: 1,
          hidden: false,
        };
        //finalSkills[tagId].name = tag;
      }
    }
  }
  return finalSkills;
}

async function getMemberAggregatedSkills(userId) {
  logger.info(`Querying MemberAggregatedSkills for userId=${userId}`);
  const rows = await MemberAggregatedSkills.getItems([userId]);
  let skills = {};
  if (rows && !_.isEmpty(rows)) {
    skills = JSON.parse(rows[0].attrs.skills);
    logger.info(`MemberAggregatedSkills item found ${userId}.`);
  } else {
    logger.info(`No MemberAggregatedSkills item found ${userId}`);
  }
  return skills;
}

async function getAutomatedTestingChallengeVerifiedSkills(
  lastUpdateThreshold,
  userSkills
) {
  const reviewName = "Automated Testing Review";
  try {
    logger.debug(`Fetching reviewType ID for Reivew ${reviewName}`);
    const reviewTypeId = await reviewService.getReviewTypeId(reviewName);
    if (reviewTypeId == null) {
      logger.error(`Failed to get review type id`);
      return [];
    }
    logger.debug(`Review Type ID ${reviewTypeId}`);
    logger.debug(`Fetching reviews...`);
    const submissionIds = await reviewService.getReviews(
      "completed",
      reviewTypeId,
      lastUpdateThreshold
    );

    logger.info(
      `Found ${
        submissionIds != null ? submissionIds.length : 0
      } submissions that passed review`
    );
    for (const submissionId of submissionIds) {
      const data = await submissionService.getChallengeIdForSubmission(
        submissionId
      );
      if (data == null) {
        logger.debug(
          `Unable to fetch submission details of submission ${submissionId}`
        );
      } else {
        const { challengeId, memberId } = data;
        let challengeTags = await challengeService.getChallengeTags(
          challengeId
        );
        if (challengeTags == null) {
          logger.error(`Unable to get challenge tags for challenge ${id}`);
        } else {
          challengeTags = challengeTags.filter(
            (tag) => tag != "Automated Testing"
          );

          if (userSkills[memberId] == null) {
            userSkills[memberId] = challengeTags;
          } else {
            userSkills[memberId] = userSkills[memberId].concat(challengeTags);
          }

          userSkills[memberId] = [...new Set(userSkills[memberId])];
        }
      }
    }

    logger.debug(`Passing submissions ${submissionIds}`);
  } catch (err) {
    logger.debug(
      `Something went wrong fetching automated testing challenge verified skills ${JSON.stringify(
        err
      )}`
    );
    return userSkills;
  }

  return userSkills;
}

async function updateSkills(batchStartDate, batchEndDate, tags) {
  let userSkills = [];
  const MAX_BYTES = 1048576; // 1MB

  // let users = {
  //   40623428: [
  //     "docker",
  //     "aws",
  //     "node.js",
  //     "axure",
  //     "user experience (ux)",
  //     "express",
  //   ],
  //   22778049: ["axure", "node.js", "user experience (ux)"],
  // };
  //const usersWithNewSkills = { 40159097: ["api testing", "appium", "chatter"], 88774597: ["facebook", "chatter", "appium"] }; //, "88774597": [ ".net", ], "8547899": [ "servlet", "applet", "node.js", ], "10336829": [ ".net", ], "16096823": [ ".net", ], "40152905": [ ".net", ], "40153455": [ ".net", ], }

  logger.info(
    `Getting users with submissions that passed review, and tags on those challenges.`
  );
  // let users = await userBatch.getUsersBatch(
  //   batchStartDate.toISODate(),
  //   batchEndDate.toISODate()
  // );

  let users = {};

  logger.info(`userSkills: ${JSON.stringify(users)}`);

  // Fetch verified skills from autograded challenges (challenge type = Automatic Testing)
  logger.info(
    `Getting users with submissions that scored >= ${config.AUTOMATED_GRADING_PASS_THRESHOLD} in ChallengeType="Automated Testing" challenges.`
  );

  users = await getAutomatedTestingChallengeVerifiedSkills(
    batchStartDate.ts,
    users == null ? {} : users
  );

  logger.info(
    `userSkills with skills from automated testing challenges: ${JSON.stringify(
      users
    )}`
  );

  logger.debug(
    `## Updating batch starting from ${batchStartDate.toISODate()} to ${batchEndDate.toISODate()}`
  );
  logger.debug(
    `Found ${Object.keys(users).length} new users with updated skills.\n `
  );
  logger.debug(
    prettier.format(JSON.stringify(users), { semi: false, parser: "json" })
  );

  for (const id in users) {
    let updatedSkills = {},
      userId = parseInt(id);
    logger.debug(`Getting existing skills for user: ${userId}.`);

    const existingSkills = await getMemberAggregatedSkills(userId);
    logger.debug(
      `Existing Skills of user ${userId} are ${JSON.stringify(existingSkills)}`
    );
    logger.debug(
      `And the user has ${Object.keys(updatedSkills).length} updated skills.`
    );

    updatedSkills = mergeChallengeSkills(existingSkills, users[userId], tags);

    logger.debug(
      `Final list of skills of user ${userId} is ${JSON.stringify(
        updatedSkills
      )}.`
    );

    if (!_.isEmpty(updatedSkills)) {
      userSkills.push({ userId: userId, skills: updatedSkills });
    }

    if (strLength(JSON.stringify(updateSkills)) > MAX_BYTES) {
      logger.info(
        `Records exceeding ${MAX_BYTES} bytes in the array, so writing to DB`
      );
      logger.info(
        `Writing ${
          userSkills.length
        } items to MemberAggregatedSkills table for the batch ${batchStartDate.toISODate()} to ${batchEndDate.toISODate()}.`
      );
      logger.debug(JSON.stringify(userSkills));
      await writeAggregatedSkills(userSkills);
      userSkills = [];
    }
  }
  logger.info(
    `Writing rest of the ${userSkills.length} items of size ${strLength(
      JSON.stringify(userSkills)
    )}`
  );
  logger.info(
    `Writing ${
      userSkills.length
    } items to MemberAggregatedSkills table for the batch ${batchStartDate.toISODate()} to ${batchEndDate.toISODate()}.`
  );
  logger.debug(
    prettier.format(JSON.stringify(userSkills), { semi: false, parser: "json" })
  );
  await writeAggregatedSkills(userSkills);
}

module.exports = {
  updateSkills,
};
