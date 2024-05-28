const https = require("https");
const path = require("path");
const fs = require("fs");
const cp = require("child_process");

// if(typeof process.env.GITHUB_ACCESS_TOKEN === "undefined"){

const CODE_DIR_PATH = path.join(__dirname, "code");
const WORD_DIR_PATH = path.join(__dirname, "word");

module.exports = { printLib, transformUrlStr, customFetch,  CODE_DIR_PATH, WORD_DIR_PATH };

/**
 *
 * @param {string | URL} url 
 * @returns
 */
async function customFetch(url) {
  

  if (!process.env.GITHUB_ACCESS_TOKEN) {
    throw new Error("Cannot access env vari");
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

/**
 *
 * @param {string | URL} url
 */
async function printLib(url) {
  //for cli eth is string
  
  url = transformUrlStr(url)
  
  const res = await customFetch(url);
  const files = res.data;

  // console.log({files});

  const downloadUrls = [];
  for (const f of files) {
    // downloadUrls.push({ [f.name]: f.download_url });
    downloadUrls.push({ name: f.name, download_url: f.download_url });
  }

  // console.log({ downloadUrls });

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

  if(url.hostname !== "github.com"){
    throw new Error(`Only support repos from github.com; Received hostname '${url.hostname}'`)
  }

  const urlPathname = url.pathname;

  const parts = urlPathname.split("/").filter(Boolean);

  const owner = parts[0];
  const repoName = parts[1];
  const repoPath = parts.slice(4).join("/");

  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${repoPath}`;


  return apiUrl
}


