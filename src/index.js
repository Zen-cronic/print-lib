const path = require("path");
const fs = require("fs");
const cp = require("child_process");

const { customFetch } = require("./customFetch");
const { transformUrlStr } = require("./utils");

const CODE_DIR_PATH = path.join(__dirname, "code");
const WORD_DIR_PATH = path.join(__dirname, "word");

module.exports = {
  printLib,
  CODE_DIR_PATH,
  WORD_DIR_PATH,
};


/**
 *
 * @param {string | URL} url
 * @param {Object} opts
 */
async function printLib(url, opts) {
  //for cli eth is string

  url = transformUrlStr(url);

  const res = await customFetch(url);
  const files = res.data;

  const downloadUrls = [];
  for (const f of files) {
    // downloadUrls.push({ [f.name]: f.download_url });
    downloadUrls.push({ name: f.name, download_url: f.download_url });
  }

  if (!fs.existsSync(CODE_DIR_PATH)) {
    fs.mkdirSync(CODE_DIR_PATH);
  }
  if (!fs.existsSync(WORD_DIR_PATH)) {
    fs.mkdirSync(WORD_DIR_PATH);
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


