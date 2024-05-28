const https = require("https");
const path = require("path");
const fs = require("fs");
const { spawn, execFileSync } = require("child_process");

// if(typeof process.env.GITHUB_ACCESS_TOKEN === "undefined"){
if (!process.env.GITHUB_ACCESS_TOKEN) {
  throw new Error("Cannot access env vari");
}
// console.log(process.env.GITHUB_ACCESS_TOKEN);
// console.log(process.env.FOO, typeof process.env.FOO === "undefined") //true

const CODE_DIR_PATH = path.join(__dirname, "code");
const WORD_DIR_PATH = path.join(__dirname, "word");

module.exports = { printLib, CODE_DIR_PATH, WORD_DIR_PATH };

async function printLib() {
  const owner = "gmrchk";
  const repo = "cli-testing-library";
  const repoPath = "src";

  const repoUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${repoPath}`;

  const res = await customFetch(repoUrl);
  const files = res.data;

  console.log("====================================");
  console.log(files);
  console.log("====================================");

  const downloadUrls = [];
  for (const f of files) {
    // downloadUrls.push({ [f.name]: f.download_url });
    downloadUrls.push({ name: f.name, download_url: f.download_url });
  }

  console.log({ downloadUrls });

  // console.log({ downloadUrls });

  //e.g.
  // "import { ChildProcessWithoutNullStreams } from 'child_process';\n" +
  //     '\n' +
  //     'export const checkRunningProcess = (currentProcessRef: {\n' +
  //     '    current: ChildProcessWithoutNullStreams | null;\n' +
  //     '}): currentProcessRef is { current: ChildProcessWithoutNullStreams } => {\n' +
  //     '    if (!currentProcessRef.current) {\n' +
  //     '        throw new Error(\n' +
  //     "            'No process is running. Start it with `execute`, or the process has already finished.'\n" +
  //     '        );\n' +
  //     '    }\n' +
  //     '\n' +
  //     '    return true;\n' +
  //     '};\n'

  if (!fs.existsSync(CODE_DIR_PATH)) {
    // console.log("DNE");
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

      // await fs.promises.writeFile(path.join(CODE_DIR_PATH, o.name), result.data, {
      //   encoding: "utf-8",
      // });

      console.log("Code Files written!");
    } catch (err) {
      console.error(`Error writing file ${o.name}: ${err}`);
      process.exit(1);
    }
  }

  //ChildProcessWithoutNullStreams
  // const cProc = spawn("python", ["main.py"]);

  // cProc.on("error", (err) => {
  //   throw err;
  // });

  // // cProc.stdout.pipe(process.stdout);
  // cProc.stderr.pipe(process.stderr);

  // //or else: A worker process has failed to exit gracefully and has been force exited.
  // //or --detectOpenHandles
  // cProc.unref()

  //windowsHide?
  try {
    //stdio default: "pipe"
    //BUT sys.stdout.write & print() writes directly to console

    execFileSync("python", ["main.py"], { encoding: "utf-8", stdio: "ignore" });

   
  } catch (error) {
    throw error;
  }
}

// test
// (async () => {
//   await printLib();
// })();

// curl -L \
//   -H "Accept: application/vnd.github+json" \
//   -H "Authorization: Bearer <YOUR-TOKEN>" \
//   -H "X-GitHub-Api-Version: 2022-11-28" \
//   https://api.github.com/repos/OWNER/REPO/contents/PATH

/**
 *
 * @param {string} url
 * @returns
 */
async function customFetch(url) {
  if (typeof url !== "string") {
    throw new TypeError(`URL must be of type string: ${url}`);
  }

  //   https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api?apiVersion=2022-11-28#headers
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Zen-cronic",
  };

  const result = await new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        headers: headers,
      },
      (res) => {
        let result = "";
        res.on("data", (data) => {
          result += data;
        });

        res.on("end", () => {
          if (res.statusCode >= 400 && res.statusCode < 500) {
            const error = new Error();
            error.name = "CustomFetchError";

            error.response = {
              data: res.statusMessage,
              headers: res.headers,
              status: res.statusCode,
              statusText: res.statusMessage,
            };
            reject(error);
          } else {
            try {
              //JSON str
              result = JSON.parse(result);
            } catch (error) {
              //html str or text str
            }

            const resolved = {
              data: result, //JSON obj OR html/text str
              headers: res.headers,
              status: res.statusCode,
              statusText: res.statusMessage,
            };

            resolve(resolved);
          }
        });

        res.on("error", reject);
      }
    );

    req.on("error", (err) => {
      //   console.error(err);
      reject(err);
    });

    req.end();
  });

  // if(!isText){
  // result.data = JSON.parse(result.data);
  // }

  return result;
}
