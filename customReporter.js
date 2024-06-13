
const fs = require("fs");
const path = require("path");

class MyReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }
  async onRunComplete(contexts, results) {
    console.log("Custom reporter output:");

    try {
      const envFilePath = path.resolve(process.cwd(), ".env.jest")

      if(results.numFailedTestSuites == 0 && results.numFailedTests == 0 ){
        //write to config/env file
        console.info("All tests passed; Set cache req to true")
        await fs.promises.writeFile(envFilePath, "\nCACHE_REQUEST=true\n", {encoding: "utf-8"})
      }
      else{
        console.warn("Failing test(s); Delete cache req")
        await fs.promises.truncate(envFilePath, 0)
      }
    } catch (error) {
      throw error
    }
   
  }
}

module.exports = MyReporter;
