const path = require("path");
const cp = require("child_process");

const { handleFetch } = require("./request");
const {
  transformUrlStr,
  ensureDirExists,
  checkOpts,
  generateCodeFile,
  hasParentDir,
  isArray,
  cleanup,
} = require("./utils");
const { performance } = require("perf_hooks");

const CODE_DIR_PATH = path.resolve("code");
const WORD_DIR_PATH = path.resolve("word");
const PDF_DIR_PATH = path.resolve("pdf");

module.exports = {
  printLib,
  CODE_DIR_PATH,
  WORD_DIR_PATH,
  PDF_DIR_PATH,
};

/**
 * @typedef {Object} DefaultOpts
 * @property {boolean} [singleFile] - If true, only a single file will be processed.
 * @property {boolean} [dir] - If true, files in the directory will be processed.
 * @property {boolean} [recursive] - If true, the files will be processed recursively.
 */

/**
 *
 * @param {string | URL} url
 * @param {DefaultOpts} opts
 */

// const defaultOpts = {
//   singleFile: true,
//   dir: false,
//   recursive: false,
// };
/**
 *
 * @param {string | URL} url
 * @param {DefaultOpts} opts
 */
async function printLib(url, opts) {
  //for cli eth is string

  try {
    opts = checkOpts(opts);

    await cleanup(CODE_DIR_PATH, WORD_DIR_PATH, PDF_DIR_PATH);

    url = transformUrlStr(url);

    ensureDirExists(CODE_DIR_PATH, WORD_DIR_PATH, PDF_DIR_PATH);

    if (opts.singleFile) {
      const res = await handleFetch(url);
      const { content, encoding, name } = res.data;

      //base64
      const encodedBuf = Buffer.from(content, encoding);

      const decodedContent = encodedBuf.toString("utf-8");

      generateCodeFile(CODE_DIR_PATH, name, decodedContent);
    } else if (opts.dir && !opts.recursive) {
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

      //recursive
    } else if (opts.dir && opts.recursive) {
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

      const codeFilesPromises = [];

      const start = performance.now()
      for (f of contextFiles) {
        //nu f.size for {type: "tree", mode: "040000"}
        if (
          f.type == "blob" &&
          f.mode === "100644" &&
          typeof f.size === "number"
        ) {
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
          codeFilesPromises.push(
            generateCodeFile(CODE_DIR_PATH, fileName, decodedContent)
          );
        }
      }
      const end = performance.now()
      const diff = end - start;

      console.log(`Time taken: ${diff / 1000} sec`);
      await Promise.all(codeFilesPromises);
    }

    //python || python3
    cp.execFileSync("python", ["main.py"], {
      encoding: "utf-8",
    });
  } catch (error) {
    throw error;
  }
}
