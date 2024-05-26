// import { Octokit } from "octokit";
// import * as https from "https";
// import * as fs from "fs";
// import * as path from "path";
// import * as url from "url"
// import { spawn } from "child_process";

// const requireESM = require("esm")(module/*, options*/)

// const { Octokit } = requireESM("octokit");
require = require("esm")(module)
const { Octokit } = require("octokit")
const https = require("https");
const path = require("path");
const fs = require("fs");

module.exports = { printLib };

async function printLib() {
  const octokit = new Octokit({
    auth: process.env.GITHUB_ACCESS_TOKEN,
  });

  const res = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner: "gmrchk",
      repo: "cli-testing-library",
      path: "src",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
        Accept: "application/vnd.github+json",
      },
    }
  );

  const files = res.data;

  console.log("====================================");
  // console.log(files);
  console.log("====================================");

  const downloadUrls = [];
  for (const f of files) {
    // downloadUrls.push({ [f.name]: f.download_url });
    downloadUrls.push({ name: f.name, download_url: f.download_url });
  }

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

  // const dir = "code";

  // const root = path.dirname(url.fileURLToPath(import.meta.url));
  // // console.log({root});
  // const codeDirname = path.join(root, dir);

  const codeDirname = path.join(__dirname, "code")
  if (!fs.existsSync(codeDirname)) {
    // console.log("DNE");
    fs.mkdirSync(codeDirname);
  }
  for (const o of downloadUrls) {
    const result = await customFetch(o.download_url);
    // console.log({result});

    fs.writeFile(
      path.join(codeDirname, o.name),
      result,
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

})
/**
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function customFetch(url) {
  if (typeof url !== "string") {
    throw new TypeError(`URL must be of type string: ${url}`);
  }

  const result = await new Promise((resolve, reject) => {
    const req = https.request(url, (res) => {
      let result = "";
      res.on("data", (data) => {
        result += data;
      });

      res.on("end", () => {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          reject(error);
        } else {
          resolve(result);
        }
      });

      res.on("error", reject);
    });

    req.on("error", (err) => {
      console.error(err);
      reject(err);
    });

    req.end();
  });

  //parse str
  // const resultData = JSON.parse(result["data"]);

  //reassign as obj
  // result["data"] = resultData;

  return result;
}
