const path = require("path");
const fs = require("fs");
const cp = require("child_process");

const { customFetch } = require("./customFetch");
const {
  transformUrlStr,
  ensureDirExists,
  checkOpts,
  generateCodeFile,
  hasParentDir,
} = require("./utils");

const CODE_DIR_PATH = path.resolve("code");
const WORD_DIR_PATH = path.resolve("word");

module.exports = {
  printLib,
  CODE_DIR_PATH,
  WORD_DIR_PATH,
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

    url = transformUrlStr(url);

    ensureDirExists(WORD_DIR_PATH);
    ensureDirExists(CODE_DIR_PATH);

    if (opts.singleFile) {
      const res = await customFetch(url);
      const { content, encoding, name } = res.data;

      //base64
      const encodedBuf = Buffer.from(content, encoding);

      const decodedContent = encodedBuf.toString("utf-8");

      generateCodeFile(CODE_DIR_PATH, name, decodedContent);
    } else if (opts.dir && !opts.recursive) {
      const res = await customFetch(url);

      const files = res.data.filter(
        (f) => f.size != 0 && f.type == "file" && f.download_url
      );

      //files.foreach - does NOT wait
      for (const f of files) {
        const textContent = await customFetch(f.download_url);
        generateCodeFile(CODE_DIR_PATH, f.name, textContent);
      }

      //recursive
    } else if (opts.dir && opts.recursive) {
      let fileCount = 0;
      // console.log({ url }); //in full

      const lastSlashIdx = url.lastIndexOf("/");
      //contents api for parent dir
      const lastSegment = url.slice(lastSlashIdx + 1);
      // console.log({lastSegment});

      const parentDirUrl = url.slice(0, lastSlashIdx);
      // console.log(parentDirUrl);

      const res = await customFetch(parentDirUrl);

      const parentFiles = res.data;
      // console.log(files);

      const contextDir = parentFiles.find(
        (f) =>
          f.name == lastSegment &&
          f.path == lastSegment &&
          f.size == 0 &&
          f.type == "dir" &&
          !f.download_url
      );

      // console.log(contextDir);

      //tree api url
      const contextDirTreeUrl = contextDir.git_url;

      // const newUrl = new URL(contextDirUrl)

      // const recursiveSearchParam = new URLSearchParams("recursive=true")
      // console.log({recursiveSearchParam});

      const recursiveDirTreeUrl = contextDirTreeUrl.concat("?recursive=true");
      // console.log(recursiveDirTreeUrl )

      const contextRes = await customFetch(recursiveDirTreeUrl);

      const contextFiles = contextRes.data.tree;
      // console.log(contextFiles);

      const fileNamesUniq = [];

      for (f of contextFiles) {
        //nu f.size for {type: "tree", mode: "040000"}
        if (
          f.type == "blob" &&
          f.mode === "100644" &&
          typeof f.size === "number"
        ) {
          fileCount++;
          // console.log(f);
          const fileRes = await customFetch(f.url);

          const { content, encoding } = fileRes.data;

          // console.log(fileRes.data);

          const filePath = f.path;
          let fileName = path.basename(filePath);
          console.log({ fileName });

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
          generateCodeFile(CODE_DIR_PATH, fileName, decodedContent);
        }
      }

      console.log({ fileCount });
    }
  } catch (error) {
    throw error;
  }

  // return;

  //ChildProcessWithoutNullStreams
  // const cProc = spawn("python", ["main.py"]);

  // //or else: A worker process has failed to exit gracefully and has been force exited.
  // //or --detectOpenHandles
  // cProc.unref()

  try {
    //stdio default: "pipe"
    //BUT sys.stdout.write & print() writes directly to console

    cp.execFileSync("python", ["main.py"], {
      encoding: "utf-8",
      // stdio: "ignore",
    });
  } catch (error) {
    throw error;
  }
}
