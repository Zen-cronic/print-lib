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

    if (results.numFailedTestSuites == 0 && results.numFailedTests == 0) {
      await fs.promises.writeFile(indicatorFilePath, indicatorStrTrue, {
        encoding: "utf-8",
      });
      console.warn("All tests passed; Set cache req to true");
    } else {
      await fs.promises.writeFile(indicatorFilePath, indicatorStrFalse, {
        encoding: "utf-8",
      });
      console.warn("Failing test(s); Set cache req to false");
    }
  }
}

module.exports = CacheRequestReporter;
