const https = require("https");
const { toNumber, formatDate } = require("./utils");

module.exports = { handleFetch, handleRateLimit };

/**
 * Composed of customFetch & handleRateLimit
 * @param {string | URL} url
 * @param {Object} [headers]
 * @returns {Promise<RateLimitInfo & Response>}
 */
async function handleFetch(url, headers) {
  const res = await customFetch(url, headers);
  const rateLimitInfo = handleRateLimit(res.headers);

  return { ...res, ...rateLimitInfo };
}

/**
 * @typedef {Object} Response
 * @property {Object | string } data - The JSON data.
 * @property {Object} headers - The headers of the response.
 * @property {number | undefined } status - The status code of the response.
 * @property {string | undefined} statusText - The status message of the response.
 */

/**
 *
 * @param {string | URL} url
 * @param {Object} [headers]
 * @returns {Promise<Response>}
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

/**
 * @typedef {Object} RateLimitInfo
 * @property {string} resetDateTime - The reset date time.
 * @property {number} limit - The limit.
 * @property {number} used - The used amount.
 * @property {number} remaining - The remaining amount.
 * @property {any} resource - The resource.
 * @property {number} reset - The reset.
 */

/**
 * Handle rate limit by parsing the res headers
 * @param {Object} headers
 * @returns {RateLimitInfo}
 * @throws If rate limit exceeded or retry-after header is present
 */
function handleRateLimit(headers) {
  if (headers.toString() != "[object Object]" || Array.isArray(headers)) {
    throw new Error(
      `Must be [object Object]; Received "${JSON.stringify(headers)}" of type ${
        Array.isArray(headers) ? `Array` : typeof headers
      }`
    );
  }
  const limit = toNumber(headers["x-ratelimit-limit"]);
  const remaining = toNumber(headers["x-ratelimit-remaining"]);
  const reset = toNumber(headers["x-ratelimit-reset"]);
  const used = toNumber(headers["x-ratelimit-used"]);
  const resource = headers["x-ratelimit-resource"];
  const retryAfter = headers["retry-after"]; //429 or 403

  if (retryAfter) {
    const sec = toNumber(retryAfter);
    const ms = sec * 1000;

    const retryAfterDateTime = formatDate(new Date(Date.now() + ms));

    throw new Error(
      `Please retry your request after ${retryAfterDateTime} (${sec} seconds from now)`
    );
  }

  const resetDateTime = formatDate(new Date(reset * 1000))

  const usedPercentage = Math.ceil((used / limit) * 100);

  const warningThreshold = [10, 25, 50, 75, 90, 100];

  const warningThresholdLen = warningThreshold.length;

  const maxThreshold = warningThreshold[warningThresholdLen - 1];

  //skip (100)
  for (let i = 0; i < warningThresholdLen - 1; i++) {
    const curr = warningThreshold[i];
    const next = warningThreshold[i + 1];

    if (usedPercentage >= maxThreshold) {
      throw new Error(
        `Ratelimit almost reached or exceeded: ${usedPercentage}%; Used: ${used}; Limit: ${limit};\nTry again after: ${resetDateTime}`
      );
    }
    if (usedPercentage >= curr && usedPercentage < next) {
      console.warn(`You've made ${usedPercentage}% of endpoint requests`);
      break;
    }
  }

  return { resetDateTime, limit, used, remaining, resource, reset };
}
