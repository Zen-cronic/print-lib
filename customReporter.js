
const fs = require("fs");
const path = require("path");

class MyReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }
  async onRunComplete(contexts, results) {
    console.log("Custom reporter output:");

    // console.log("Contexts:", contexts);
    // console.log("Results:", results);

    try {
      const envFilePath = path.resolve(process.cwd(), ".env.jest")

      if(results.numFailedTestSuites == 0 && results.numFailedTests == 0 ){
        //write to config/env file
        await fs.promises.writeFile(envFilePath, "\nCACHE_REQUEST=true\n", {encoding: "utf-8"})
      }
      else{
        await fs.promises.truncate(envFilePath, 0)
      }
    } catch (error) {
      throw error
    }
   
  }
}

module.exports = MyReporter;
