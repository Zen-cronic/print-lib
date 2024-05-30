const https = require("https");


module.exports = {customFetch}
/**
 *
 * @param {string | URL} url
 * @param {Object} [headers]
 * @returns
 */
async function customFetch(url, headers) {
    if (!process.env.GITHUB_ACCESS_TOKEN) {
      throw new Error("Cannot access env vari");
    }
  
    if (!headers) {
      //   https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api?apiVersion=2022-11-28#headers
  
      //default headerss
      headers = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Zen-cronic",
      };
    }
  
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
  
    return result;
  }
  