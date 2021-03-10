const loader = require("./loader")


const startPatchDate = "2019-02-01", endPatchDate = "2020-01-01", batchSizeInDays =2;

loader.runLoader(startPatchDate, endPatchDate, batchSizeInDays).catch((err) => console.error(err));
