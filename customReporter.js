
const fs = require("fs");
const path = require("path");
const dotenv = require('dotenv');

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
        process.env.CACHE_REQUEST = false
        // await fs.promises.truncate(envFilePath, 0)
      }

      // dotenv.config({path: envFilePath})
    } catch (error) {
      throw error
    }
   
  }
}

module.exports = MyReporter;
