module.exports = {
  parsePdf,
  composeTextFromPdf,
  isCI,
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
 * Check for GitHub Actions CI
 * @returns {boolean}
 */
function isCI() {
  return process.env.CI === 'true'
  
}
