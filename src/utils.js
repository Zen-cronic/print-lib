const fs = require("fs");
const path = require("path");

module.exports = {
  transformUrlStr,
  ensureDirExists,
  checkOpts,
  generateCodeFile,
  hasParentDir,
  toNumber,
  isArray,
  formatDate,
  replaceWhitespace,
  cleanup,
};

/**
 * @typedef {Object} DefaultOpts
 * @property {boolean} [singleFile] - If true, only a single file will be processed.
 * @property {boolean} [dir] - If true, files in the directory will be processed.
 * @property {boolean} [recursive] - If true, the files will be processed recursively.
 */

/**
 * @param {DefaultOpts} opts
 * @returns {DefaultOpts}
 */
function checkOpts(opts) {
  //null
  if (typeof opts === "object" && !opts) {
    const defaultOpts = {
      singleFile: true,
      dir: false,
      recursive: false,
    };

    return defaultOpts;
  }
  if ((opts.singleFile && opts.dir) || (opts.singleFile && opts.recursive)) {
    throw new Error(
      `Options dir ${opts.dir} or recursive ${opts.recursive} cannot be set alongside singleFile ${opts.singleFile}`
    );
  }

  return opts;
}
/**
 *
 * @param {string | URL} url
 * @returns {string}
 */
function transformUrlStr(url) {
  if (typeof url !== "string" && !(url instanceof URL)) {
    throw new TypeError(
      `Param must be of type string or URL; Received object: ${url} of type ${typeof url}`
    );
  }

  if (typeof url === "string") {
    url = new URL(url);
  }

  if (url.hostname !== "github.com") {
    throw new Error(
      `Only support repos from github.com; Received hostname '${url.hostname}'`
    );
  }

  const urlPathname = url.pathname;

  const parts = urlPathname.split("/").filter(Boolean);

  const owner = parts[0];
  const repoName = parts[1];
  const repoPath = parts.slice(4).join("/");

  //ensure nu trailing /

  const CONTENTS_API_URL = `https://api.github.com/repos/${owner}/${repoName}/contents/${repoPath}`;
  return CONTENTS_API_URL;
}

/**
 *  Create dirs if it does NOT exist; Exit with 1 if error
 * @param {...string} dirPaths
 */
function ensureDirExists(...dirPaths) {
  try {
    dirPaths.forEach((path) => {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
      }
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

/**
 *
 * @param {string} dirPath
 * @param {string} filename
 * @param {string} content
 */
function generateCodeFile(dirPath, filename, content) {
  try {
    fs.writeFileSync(path.join(dirPath, filename), content, {
      encoding: "utf-8",
    });

    // console.log("Code Files written!");
  } catch (err) {
    console.error(`Error writing file ${filename}: ${err}`);
    throw err;
  }
}

/**
 *
 * @param {string} filePath
 * @returns {boolean}
 */
function hasParentDir(filePath) {
  return path.basename(filePath) != filePath;
}

/**
 * Convert numerical string into number type
 * @param {string} str
 * @returns {number}
 */
function toNumber(str) {
  return +str;
}

/**
 *
 * @param {Array} arr
 * @returns {boolean}
 */
function isArray(arr) {
  return Array.isArray(arr);
}

/**
 *
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const toStr = Object.prototype.toString;

  if (!(date instanceof Date) || toStr.call(date) !== "[object Date]") {
    throw new Error(
      `Expected Date object; Received "${date}" of type ${typeof date} | ${toStr.call(
        date
      )}`
    );
  }
  const dateOpts = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  };

  const formattedDate = date.toLocaleDateString("en-US", dateOpts);

  return formattedDate;
}

/**
 *
 * @param {string} str
 * @returns {string}
 */
function replaceWhitespace(str) {
  return str.replace(/\s+/g, "");
}

/**
 *
 * @param  {...string} absPaths
 */
function cleanup(...absPaths) {
  
  absPaths.forEach((path) => {
    fs.rmSync(path, { recursive: true, force: true });
  });
}

//TC: decode base64
