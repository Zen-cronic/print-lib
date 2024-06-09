/** @type {import('jest').Config} */

const config = {
  verbose: true,
  watchPathIgnorePatterns: ["<rootDir>/(misc|word|code|dev|pg|pdf)/"],
};

module.exports = config;
