/** @type {import('jest').Config} */

const config = {
  reporters: ["default", "<rootDir>/customReporter.js"],
  watchPathIgnorePatterns: ["<rootDir>/(misc|word|code|dev|pg|pdf)/"],
};

module.exports = config;
