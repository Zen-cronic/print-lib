const fs = require("fs");
const path = require("path");

class CacheRequestReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }
  async onRunComplete(contexts, results) {
    console.log("Custom reporter output:");

    const indicatorFilePath = path.resolve(
      process.cwd(),
      "__tests__",
      "cacheRequestIndicator.txt"
    );

    if (results.numFailedTestSuites == 0 && results.numFailedTests == 0) {
      //write to config/env file
      console.info("All tests passed; Set cache req to true");
      await fs.promises.writeFile(indicatorFilePath, "\nCACHE_REQUEST=true\n", {
        encoding: "utf-8",
      });
    } else {
      console.warn("Failing test(s); Delete cache req");
      await fs.promises.truncate(indicatorFilePath, 0);
    }
  }
}

module.exports = CacheRequestReporter;
