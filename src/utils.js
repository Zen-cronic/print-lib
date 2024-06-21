const fs = require("fs");
const path = require("path");

module.exports = {
  transformUrlStr,
  ensureDirExists,
  generateCodeFile,
  hasParentDir,
  toNumber,
  isArray,
  formatDate,
  replaceWhitespace,
  cleanup,
  humanizeContent,
  getClassName,
  isPlainObject,
};

/**
 *
 * @param {string | URL} url
 * @returns {string}
 */
function transformUrlStr(url) {
  if (typeof url != "string" && !(url instanceof URL)) {
    const className = getClassName(url)
    throw new TypeError(
      `Param must be of type string or URL; Received object: ${url} of type ${className}`
    );
  }

  if (typeof url == "string") {
    url = new URL(url);
  }

  if (url.hostname != "github.com") {
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

  const contents_api_url = `https://api.github.com/repos/${owner}/${repoName}/contents/${repoPath}`;
  return contents_api_url;
}

/**
 *  Create dirs if it does NOT exist
 * @param {...string} dirPaths
 */
function ensureDirExists(...dirPaths) {
  dirPaths.forEach((path) => {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  });
}

/**
 *
 * @param {string} dirPath
 * @param {string} filename
 * @param {string} content
 */
async function generateCodeFile(dirPath, filename, content) {
  try {
    await fs.promises.writeFile(path.join(dirPath, filename), content, {
      encoding: "utf-8",
    });
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
  const className = getClassName(date);

  if (!(date instanceof Date) || className != "[object Date]") {
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
async function cleanup(...absPaths) {
  const promises = [];
  for (const path of absPaths) {
    promises.push(fs.promises.rm(path, { recursive: true, force: true }));
  }
  await Promise.all(promises);
}

/**
 * Decode content (i.e., from base64 into utf-8)
 * @param {string} content
 * @param {string} encoding
 * @returns {string}
 */
function humanizeContent(content, encoding) {
  const encodedBuf = Buffer.from(content, encoding);

  const decodedContent = encodedBuf.toString("utf-8");

  return decodedContent;
}

/**
 *
 * @param {any} o
 * @returns {string}
 */
function getClassName(o) {
  return Object.prototype.toString.call(o);
}

/**
 *
 * @param {any} o
 * @returns {boolean}
 */
function isPlainObject(o) {
  return getClassName(o) == "[object Object]";
}
