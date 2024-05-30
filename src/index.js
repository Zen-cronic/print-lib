const path = require("path");
const fs = require("fs");
const cp = require("child_process");

const { customFetch } = require("./customFetch");
const {
  transformUrlStr,
  ensureDirExists,
  checkOpts,
  generateCodeFile,
} = require("./utils");

const CODE_DIR_PATH = path.join(__dirname, "code");
const WORD_DIR_PATH = path.join(__dirname, "word");

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
        (f) => f.size != 0 && f.download_url && f.type == "size"
      );

      //files.foreach - does NOT wait
      for (const f of files) {
        const textContent = await customFetch(f.download_url);
        generateCodeFile(CODE_DIR_PATH, f.name, textContent);
      }

      //recursive
    } else if (opts.dir && opts.recursive) {

      url = transformUrlStr(url)


    }
  } catch (error) {
    throw error;
  }

  for (const o of downloadUrls) {
    try {
      const result = await customFetch(o.download_url);

      fs.writeFileSync(path.join(CODE_DIR_PATH, o.name), result.data, {
        encoding: "utf-8",
      });

      console.log("Code Files written!");
    } catch (err) {
      console.error(`Error writing file ${o.name}: ${err}`);
      process.exit(1);
    }
  }

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
      stdio: "ignore",
    });
  } catch (error) {
    throw error;
  }
}
