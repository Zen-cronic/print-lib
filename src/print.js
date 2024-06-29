const path = require("path");
const cp = require("child_process");
const util = require("util");
const { platform } = require("process");
const fs = require("node:fs/promises");

const { RequestHandler } = require("./RequestHandler");
const {
  transformUrlStr,
  ensureDirExists,
  generateCodeFile,
  hasParentDir,
  isArray,
  cleanup,
  humanizeContent,
} = require("./utils");
const { isCI } = require("./testUtils");

const CODE_DIR_PATH = path.resolve(process.cwd(), "code");
const HTML_DIR_PATH = path.resolve(process.cwd(), "html");

// const WORD_DIR_PATH = path.resolve(process.cwd(), "word");
// const PDF_DIR_PATH = path.resolve(process.cwd(), "pdf");
const GITHUB_RATE_LIMIT_ENDPOINT = "https://api.github.com/rate_limit";

module.exports = {
  printLib,
  CODE_DIR_PATH,
  // WORD_DIR_PATH,
  // PDF_DIR_PATH,
  execConversion,
  checkRateLimit,
};

/**
 * @typedef {Object} ApiOpts
 * @property {string} link - The github repo link
 * @property {"file"|"dir"|"recursive"} linkType - The type of the github repo link
 * @property {string} auth - Your github access token
 * @property {string} userAgent - Your github username or app name
 * @property {"word"|"pdf"} convertTo - The conversion format (pdf only available Win/macOS with MS Word installed and granted permission)
 */

/**
 * @public
 * @param {ApiOpts} opts
 */
async function printLib(opts) {
  try {
    await cleanup(
      CODE_DIR_PATH,
      HTML_DIR_PATH
      // WORD_DIR_PATH, PDF_DIR_PATH
    );

    const url = transformUrlStr(opts.link);

    ensureDirExists(
      CODE_DIR_PATH,
      HTML_DIR_PATH
      // WORD_DIR_PATH, PDF_DIR_PATH
    );

    const reqHandler = new RequestHandler(opts.auth, opts.userAgent);

    switch (opts.linkType) {
      case "file":
        await printFile(url, reqHandler);
        break;
      case "dir":
        await printDir(url, reqHandler);
        break;
      case "recursive":
        await printRecursive(url, reqHandler);
        break;

      default:
        throw new Error(`Unsupported linkType: ${opts.linkType}`);
    }

    // await execConversion(opts.convertTo);

    const files = await fs.readdir(CODE_DIR_PATH, { recursive: true });
    console.log({ files });

    for (const f of files) {
      const absPath = path.resolve(process.cwd(), CODE_DIR_PATH, f);
      const contentStr = await fs.readFile(absPath, { encoding: "utf-8" });

      const contentHtml = `<html><body><code><pre>${contentStr}</pre></code></body></html>`;

      const absHtmlPath = path.resolve(
        process.cwd(),
        HTML_DIR_PATH,
        f + ".html"
      );

      await fs.writeFile(absHtmlPath, contentHtml, { encoding: "utf-8" });
    }
  } catch (error) {
    console.error(error);
    // throw error;
  }
}

/**
 * @param {string} url - GitHub repo url
 * @param {RequestHandler} reqHandler
 */
async function printFile(url, reqHandler) {
  const res = await reqHandler.handleFetch(url);
  const { content, encoding, name } = res.data;

  //base64
  const decodedContent = humanizeContent(content, encoding);

  generateCodeFile(CODE_DIR_PATH, name, decodedContent);
}

/**
 * @param {string} url - GitHub repo url
 * @param {RequestHandler} reqHandler
 */
async function printDir(url, reqHandler) {
  const res = await reqHandler.handleFetch(url);

  if (!isArray(res.data)) {
    throw new Error(
      `Must be an array; Received ${res.data} of type ${typeof res.data}`
    );
  }
  const files = res.data.filter(
    (f) => f.size != 0 && f.type == "file" && f.download_url
  );

  //files.foreach - does NOT wait
  for (const f of files) {
    const res = await reqHandler.handleFetch(f.download_url);
    generateCodeFile(CODE_DIR_PATH, f.name, res.data);
  }
}

/**
 * @param {string} url - GitHub repo url
 * @param {RequestHandler} reqHandler
 */
async function printRecursive(url, reqHandler) {
  const lastSlashIdx = url.lastIndexOf("/");

  const lastSegment = url.slice(lastSlashIdx + 1);

  //contents api for parent dir
  const parentDirUrl = url.slice(0, lastSlashIdx);

  const res = await reqHandler.handleFetch(parentDirUrl);

  const parentFiles = res.data;

  if (!isArray(parentFiles)) {
    throw new Error(
      `Must be an array; Received ${res.data} of type ${typeof res.data}`
    );
  }
  const contextDir = parentFiles.find(
    (f) =>
      f.name == lastSegment &&
      f.path == lastSegment &&
      f.size == 0 &&
      f.type == "dir" &&
      !f.download_url
  );

  //tree api url
  const contextDirTreeUrl = contextDir.git_url;

  const recursiveDirTreeUrl = contextDirTreeUrl.concat("?recursive=true");

  const contextRes = await reqHandler.handleFetch(recursiveDirTreeUrl);

  const contextFiles = contextRes.data.tree;

  if (!isArray(contextFiles)) {
    throw new Error(
      `Must be an array; Received ${res.data} of type ${typeof res.data}`
    );
  }
  const fileNamesUniq = [];

  const genCodeFilesPromises = [];

  for (f of contextFiles) {
    //nu f.size for {type: "tree", mode: "040000"}
    if (f.type == "blob" && f.mode === "100644" && typeof f.size === "number") {
      const fileRes = await reqHandler.handleFetch(f.url);

      const { content, encoding } = fileRes.data;

      const filePath = f.path;
      let fileName = path.basename(filePath);

      if (!fileNamesUniq.includes(fileName) && !hasParentDir(filePath)) {
        fileNamesUniq.push(fileName);
      } else {
        // dir/file.js -> DIR-file.js
        fileName = filePath
          .split("/")
          .map((seg, idx, arr) => {
            if (++idx == arr.length) {
              return seg;
            } else {
              return seg.toUpperCase();
            }
          })
          .join("-");
      }

      const decodedContent = humanizeContent(content, encoding);
      genCodeFilesPromises.push(
        generateCodeFile(CODE_DIR_PATH, fileName, decodedContent)
      );
    }
  }

  await Promise.all(genCodeFilesPromises);
}

/**
 * Execute work and pdf conversion process for all files in the "code" dir
 * @param {"word" | "pdf"} convertTo
 */
async function execConversion(convertTo) {
  if (convertTo !== "word" && convertTo !== "pdf") {
    throw new Error(`Invalid conversion arg: '${convertTo}'`);
  }

  //python || python3
  const asyncExecFile = util.promisify(cp.execFile);

  const pyScript = platform == "win32" ? "python" : "python3";

  if (isCI()) {
    convertTo = "word";
  }
  //fallback to word doc if arg = 'pdf' and platform = 'linux', etc.
  else if (platform != "win32" && platform != "darwin" && convertTo == "pdf") {
    console.error(
      `Provided convertTo arg: '${convertTo}' is only compatible with win32 or macOS; Current platform: ${platform}; Fallback to .docx conversion`
    );

    convertTo = "word";
  }

  const scriptPath = path.join(__dirname, "..", "python", "main.py");
  await asyncExecFile(pyScript, [scriptPath, convertTo], {
    encoding: "utf-8",
  });
}

/**
 * @typedef {Object} RateLimitInfoCore
 * @property {number} limit - The maximum number of requests that the consumer is permitted to make.
 * @property {number} used - The number of requests that have been made.
 * @property {number} remaining - The number of requests allowed before the rate limit is reached.
 * @property {number} reset - The time at which the current rate limit window resets in UTC epoch seconds.
 */
/**
 * Logs and return the rate limit information based on your GitHub token
 * @param {string} auth
 * @param {string} userAgent
 * @returns {Promise<RateLimitInfoCore>}
 */
async function checkRateLimit(auth, userAgent) {
  if (typeof auth != "string" || typeof userAgent != "string") {
    throw new Error("Required params must be of type string");
  }
  const reqHandler = new RequestHandler(auth, userAgent);
  const res = await reqHandler.handleFetch(GITHUB_RATE_LIMIT_ENDPOINT);

  const { resources } = res.data;

  const { core } = resources;

  console.log(`Ratelimit reset at: ${res.resetDateTime}`);
  console.log(JSON.stringify(core, null, 2));

  return core;
}
