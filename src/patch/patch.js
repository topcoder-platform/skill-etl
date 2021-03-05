const loader = require("./loader")

const startPatchDate = "2021-01-01", endPatchDate = "2021-02-26", batchSizeInDays = 20;

loader.runLoader(startPatchDate, endPatchDate, batchSizeInDays).catch((err) => console.error(err));
