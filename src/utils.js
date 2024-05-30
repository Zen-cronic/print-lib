const fs = require("fs");
const path = require("path");

module.exports = {
  transformUrlStr,
  ensureDirExists,
  checkOpts,
  generateCodeFile,
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

  const CONTENTS_API_URL = `https://api.github.com/repos/${owner}/${repoName}/contents/${repoPath}`;

  return CONTENTS_API_URL;
}

/**
 *  Create dir if it does NOT exist; Exit with 1 if error
 * @param {string} dirPath
 */
function ensureDirExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

function generateCodeFile(dirPath, filename, content) {
  try {
    fs.writeFileSync(path.join(dirPath, filename), content, {
      encoding: "utf-8",
    });

    console.log("Code Files written!");
  } catch (err) {
    console.error(`Error writing file ${o.name}: ${err}`);
    // process.exit(1);
    throw err;
  }
}
