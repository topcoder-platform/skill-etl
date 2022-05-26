var { DateTime } = require("luxon");
const userBatch = require("../services/userBatch");
const tagsMap = require("../services/tagService")
const logger = require("../common/logger");
const skillUpdater = require("../loaders/skilUpdater")

/**
 *
 * @param {String} patchStartDate Start patch date
 * @param {String} patchEndDate End patch date
 * @param {Number} JI Jump interval in days
 */

async function runLoader(patchStartDate, patchEndDate, JI) {
    logger.debug(` ************************** Skills Loader Started ************************`)
    logger.debug( `Updating new user batch starting from ${patchStartDate} to ${patchEndDate}, each batch consists of ${JI} days` );
    const tags = await tagsMap.getTagsfromAPI();
    logger.debug(`Loaded ${Object.keys(tags).length} tags.`);
    JI = JI - 1;
    let batchStartDate = DateTime.fromISO(patchStartDate),
    diffInDays = 0,
    batchEndDate = null;
    const ED = DateTime.fromISO(patchEndDate);

    while (ED.diff(batchStartDate) >= 0) {
        diffInDays = ED.diff(batchStartDate, "days").toObject();        
        if (diffInDays.days > 1) {
            batchEndDate = batchStartDate.plus({ days: JI });
        } else {
            batchEndDate = ED;
        }
        await skillUpdater.updateSkills(batchStartDate, batchEndDate, tags);
        batchStartDate = batchEndDate.plus({ days: 1 });
    }
     logger.debug(` ************************** Skills Loader Finished ************************`)
}

module.exports = {
  runLoader,
};
