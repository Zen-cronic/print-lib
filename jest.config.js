const CACHE_REQUEST_REPORTER_PATH =
  "<rootDir>/__tests__/cacheRequestReporter.js";
const CACHE_REQUEST_INDICATOR_PATH =
  "<rootDir>/__tests__/cacheRequestIndicator.txt";

/** @type {import('jest').Config} */

const config = {
  reporters: ["default", CACHE_REQUEST_REPORTER_PATH],
  watchPathIgnorePatterns: [
    "<rootDir>/(misc|word|code|dev|pg|pdf)/",
    CACHE_REQUEST_INDICATOR_PATH,
  ],
  testPathIgnorePatterns: [CACHE_REQUEST_REPORTER_PATH],
  setupFiles: ["dotenv/config"],
};

module.exports = config;
