const fs = require("fs");
const path = require("path");

module.exports = {
  parsePdf,
  composeTextFromPdf,
  isCI,
  isCacheReq,
};

/**
 * @typedef {Object} TextItem
 * @property {number} y - The Y coordinate
 * @property {string} text - The text
 */

/**
 * @param {string} filePath
 * @returns {Promise<{yCoordinates: Array<number>, texts: Array<TextItem>}>}
 */
async function parsePdf(filePath) {
  const { PdfReader } = await import("pdfreader");

  return new Promise((resolve, reject) => {
    const yCoordinates = [];
    const texts = [];

    const pdfReader = new PdfReader();
    pdfReader.parseFileItems(filePath, (err, item) => {
      if (err) {
        console.error(err);
        reject(err);
      } else if (!item) {
        //eof
        resolve({ yCoordinates, texts });
      } else if (item.text) {
        yCoordinates.push(item.y);
        texts.push({ y: item.y, text: item.text });
      }
    });
  });
}

/**
 *
 * @param {number} skipY
 * @param {Array<TextItem>} texts
 */
function composeTextFromPdf(skipY, texts) {
  let text = "";
  for (const item of texts) {
    if (item.y > skipY) {
      text += item.text;
    }
  }

  return text;
}

/**
 * Check if the environemnt is in GitHub Actions CI runner
 * @returns {boolean}
 */
function isCI() {
  return process.env.CI == "true";
}

/**
 * Check if the request should be cached via noop in the .env.jest file
 * @returns {Promise<boolean>}
 */
async function isCacheReq() {
  const envJestFilePath = path.resolve(process.cwd(), ".env.jest");

  const loadEnv = process.loadEnvFile;

  let envObj = {};

  // < v20.12.0
  if (typeof loadEnv != "function") {
    const envContent = await fs.promises.readFile(envJestFilePath, {
      encoding: "utf-8",
    });
    const envArr = envContent.split("\n");
    envObj = envArr.reduce((acc, curr) => {
      if (curr) {
        const [key, val] = curr.split("=");
        acc[key] = val;
      }

      return acc;
    }, {});
  } else {
    process.loadEnvFile((envJestFilePath));
    envObj = { ...process.env };

  }

  return envObj.CACHE_REQUEST == "true";
}
