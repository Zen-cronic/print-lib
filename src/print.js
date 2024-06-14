const path = require("path");
const cp = require("child_process");
const util = require("util");
const { platform } = require("process");
const { performance } = require("perf_hooks");

const { handleFetch } = require("./request");
const {
  transformUrlStr,
  ensureDirExists,
  generateCodeFile,
  hasParentDir,
  isArray,
  cleanup,
} = require("./utils");

const CODE_DIR_PATH = path.resolve(process.cwd(), "code");
const WORD_DIR_PATH = path.resolve(process.cwd(), "word");
const PDF_DIR_PATH = path.resolve(process.cwd(), "pdf");

module.exports = {
  printLib,
  CODE_DIR_PATH,
  WORD_DIR_PATH,
  PDF_DIR_PATH,
  execConversion,
};

/**
 * @typedef {Object} ApiOpts
 * @property {string} link - The github repo link
 * @property {"file"|"dir"|"recursive"} linkType - The type of the github repo link
 * @property {string} auth - The github access token
 * @property {"word"|"pdf"} convertTo - The conversion format (pdf only available Win/macOS with MS Word installed and granted permission)
 */

/**
 * @public
 * @param {ApiOpts} opts
 */
async function printLib(opts) {
  try {
    await cleanup(CODE_DIR_PATH, WORD_DIR_PATH, PDF_DIR_PATH);

    const url = transformUrlStr(opts.link);

    ensureDirExists(CODE_DIR_PATH, WORD_DIR_PATH, PDF_DIR_PATH);

    switch (opts.linkType) {
      case "file":
        await printFile(url);
        break;
      case "dir":
        await printDir(url);
        break;
      case "recursive":
        await printRecursive(url);
        break;

      default:
        throw new Error(`Unsupported linkType: ${opts.linkType}`);
    }

    await execConversion(opts.convertTo);
  } catch (error) {
    throw error;
  }
}

/**
 * @param {string} url - GitHub repo url
 */
async function printFile(url) {
  const res = await handleFetch(url);
  const { content, encoding, name } = res.data;

  //base64
  const encodedBuf = Buffer.from(content, encoding);

  const decodedContent = encodedBuf.toString("utf-8");

  generateCodeFile(CODE_DIR_PATH, name, decodedContent);
}

/**
 * @param {string} url - GitHub repo url
 */
async function printDir(url) {
  const res = await handleFetch(url);

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
    const res = await handleFetch(f.download_url);
    generateCodeFile(CODE_DIR_PATH, f.name, res.data);
  }
}

/**
 * @param {string} url - GitHub repo url
 */
async function printRecursive(url) {
  const lastSlashIdx = url.lastIndexOf("/");

  const lastSegment = url.slice(lastSlashIdx + 1);

  //contents api for parent dir
  const parentDirUrl = url.slice(0, lastSlashIdx);

  const res = await handleFetch(parentDirUrl);

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

  const contextRes = await handleFetch(recursiveDirTreeUrl);

  const contextFiles = contextRes.data.tree;

  if (!isArray(contextFiles)) {
    throw new Error(
      `Must be an array; Received ${res.data} of type ${typeof res.data}`
    );
  }
  const fileNamesUniq = [];

  const genCodeFilesPromises = [];

  const start = performance.now();
  for (f of contextFiles) {
    //nu f.size for {type: "tree", mode: "040000"}
    if (f.type == "blob" && f.mode === "100644" && typeof f.size === "number") {
      const fileRes = await handleFetch(f.url);

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

      const encodedBuf = Buffer.from(content, encoding);
      const decodedContent = encodedBuf.toString("utf-8");
      genCodeFilesPromises.push(
        generateCodeFile(CODE_DIR_PATH, fileName, decodedContent)
      );
    }
  }
  const end = performance.now();
  const diff = end - start;

  console.log(`Time taken 2+n requests: ${diff / 1000} sec`);

  const startGenCode = performance.now();
  await Promise.all(genCodeFilesPromises);
  const endGenCode = performance.now();

  const diffCodeGen = endGenCode - startGenCode;

  console.log(`Time taken Gen Code: ${diffCodeGen / 1000} sec`);
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

  const startPy = performance.now();

  const pyScript = platform == "win32" ? "python" : "python3";

  //fallback to word doc if arg = 'pdf' and platform = 'linux', etc.
  if (platform != "win32" && platform != "darwin" && convertTo == "pdf") {
    console.error(
      `Provided convertTo arg: '${convertTo}' is only compatible with win32 or macOS; Current platform: ${platform}; Fallback to .docx conversion`
    );

    convertTo = "word";
  }
  await asyncExecFile(pyScript, ["main.py", convertTo], {
    encoding: "utf-8",
  });
  const endPy = performance.now();
  const diffPy = endPy - startPy;

  console.log(`Time taken Py: ${diffPy / 1000} sec`);
}
