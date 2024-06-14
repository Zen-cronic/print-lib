/** @type {import('jest').Config} */
require("dotenv").config({ path: "./.env.jest" , override: true});

const config = {
  reporters: ["default", "<rootDir>/customReporter.js"],
  watchPathIgnorePatterns: ["<rootDir>/(misc|word|code|dev|pg|pdf)/", "<rootDir>/__tests__"],

};

module.exports = config;
