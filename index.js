// import { Octokit } from "octokit";
// import * as https from "https";
// import * as fs from "fs";
// import * as path from "path";
// import * as url from "url"
// import { spawn } from "child_process";

// const { Octokit } = require("octokit");
const https = require("https");
const path = require("path");
const fs = require("fs");
const {spawn} = require("child_process")

// if(typeof process.env.GITHUB_ACCESS_TOKEN === "undefined"){
if (!process.env.GITHUB_ACCESS_TOKEN) {
  throw new Error("Cannot access env vari");
}
// console.log(process.env.GITHUB_ACCESS_TOKEN);
// console.log(process.env.FOO, typeof process.env.FOO === "undefined") //true

module.exports = { printLib };

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

  const codeDirname = path.join(__dirname, "code");
  if (!fs.existsSync(codeDirname)) {
    // console.log("DNE");
    fs.mkdirSync(codeDirname);
  }
  for (const o of downloadUrls) {
    const result = await customFetch(o.download_url, true);
    // console.log({result});

    fs.writeFile(
      path.join(codeDirname, o.name),
      // result,
      result.data,
      { encoding: "utf-8" },
      (err) => {
        if (err) throw err;

        console.log("Code Files written!");
      }
    );
  }

  const cProc = spawn("python", ["main.py"]);

  cProc.on("error", console.error);

  cProc.stdout.pipe(process.stdout);
  cProc.stderr.pipe(process.stderr);
}

// test
(async () => {
  await printLib();
})();

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
async function customFetch(url, isText=false) {
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
            // console.log({result});

            try {
              //JSON str
              result = JSON.parse(result)
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
 

  return result
}
