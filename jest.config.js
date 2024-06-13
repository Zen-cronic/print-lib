/** @type {import('jest').Config} */
require("dotenv").config({ path: "./.env.jest" });

const config = {
  reporters: ["default", "<rootDir>/customReporter.js"],
  watchPathIgnorePatterns: ["<rootDir>/(misc|word|code|dev|pg|pdf)/"],
};

module.exports = config;
