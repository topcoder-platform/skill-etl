const loader = require("./loader")

const startPatchDate = "2019-01-01", endPatchDate = "2021-03-08", batchSizeInDays = 10;

loader.runLoader(startPatchDate, endPatchDate, batchSizeInDays).catch((err) => console.error(err));
