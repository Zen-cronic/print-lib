/** @type {import('jest').Config} */
const config = {
  watchPathIgnorePatterns: [
    "<rootDir>/misc/",
    "<rootDir>/word/",
    "<rootDir>/code/",
    "<rootDir>/dev/",
    "<rootDir>/pg/",
  ],
};

module.exports = config;
