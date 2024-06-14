const fs = require("fs");
const path = require("path");

class CacheRequestReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }
  async onRunComplete(_, results) {
    console.log("Custom reporter output:");

    const indicatorFilePath = path.resolve(
      process.cwd(),
      "__tests__",
      "cacheRequestIndicator.txt"
    );

    const indicatorStrTrue = "\nCACHE_REQUEST=true\n";
    const indicatorStrFalse = "\nCACHE_REQUEST=false\n";

    //write to config/env file

    if (results.numFailedTestSuites == 0 && results.numFailedTests == 0) {
      console.info("All tests passed; Set cache req to true");
      await fs.promises.writeFile(indicatorFilePath, indicatorStrTrue, {
        encoding: "utf-8",
      });
    } else {
      // fs.writeFileSync(indicatorFilePath, indicatorStrFalse, {
      //   encoding: "utf-8",
      // });
      await fs.promises.writeFile(indicatorFilePath, indicatorStrFalse, {
        encoding: "utf-8",
      });
      console.warn("Failing test(s); Delete cache req");

    }
  }
}

module.exports = CacheRequestReporter;
