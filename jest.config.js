/** @type {import('jest').Config} */

const config = {
  reporters: ["default", "<rootDir>/__tests__/cacheRequestReporter.js"],
  watchPathIgnorePatterns: [
    "<rootDir>/(misc|word|code|dev|pg|pdf)/",
    "<rootDir>/__tests__/cacheRequestIndicator.txt",
  ],
  testPathIgnorePatterns: ["<rootDir>/__tests__/cacheRequestReporter.js"],
  setupFiles: ["dotenv/config"],
};

module.exports = config;
