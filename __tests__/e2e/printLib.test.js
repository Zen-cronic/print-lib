const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const { describe, it, expect, beforeAll } = require("@jest/globals");

const {
  printLib,
  CODE_DIR_PATH,
  WORD_DIR_PATH,
  PDF_DIR_PATH,
} = require("../../src");

const {
  parsePdf,
  composeTextFromPdf,
  isCI,
  isCacheReq,
} = require("../../src/testUtils");
const { replaceWhitespace } = require("../../src/utils");

describe("printLib function", () => {
  let codeFilenames;
  let wordFileNames;
  let pdfFileNames;
  const isInCIEnv = isCI();
  const WORD_EXTNAME = ".docx";

  beforeAll(async () => {
    const url = "https://github.com/mwilliamson/mammoth.js/tree/master/lib";

    let printLibMaybeStub = printLib;

    const indicatorFilePath = path.resolve(
      process.cwd(),
      "__tests__",
      "cacheRequestIndicator.txt"
    );

    const isCached = await isCacheReq(indicatorFilePath);

    // no stub in CI
    if (isCached && !isInCIEnv) {
      printLibMaybeStub = () => {
        return Promise.resolve();
      };
      console.log("printLib called as stub");
    }

    //either a stub or actual fn
    await printLibMaybeStub({
      link: url,
      linkType: "recursive",
      auth: process.env.API_ACCESS_TOKEN,
      userAgent: "Zen-cronic",
      convertTo: "pdf",
    });

    const codeFilenamesPromise = fs.promises.readdir(CODE_DIR_PATH, {
      encoding: "utf-8",
    });
    const wordFileNamesPromise = fs.promises.readdir(WORD_DIR_PATH, {
      encoding: "utf-8",
    });
    const pdfFileNamesPromise = fs.promises.readdir(PDF_DIR_PATH, {
      encoding: "utf-8",
    });

    [codeFilenames, wordFileNames, pdfFileNames] = await Promise.all([
      codeFilenamesPromise,
      wordFileNamesPromise,
      pdfFileNamesPromise,
    ]);
  }, 40000);

  describe("given a valid repository url is requested", () => {
    it("should create corresponding files for code and word in the same order", () => {
      expect(codeFilenames.length).toBe(wordFileNames.length);

      for (let i = 0; i < codeFilenames.length; i++) {
        const codeExtname = path.extname(codeFilenames[i]);

        const currentCodeFilename = codeFilenames[i].replace(codeExtname, "");
        const currentWordFilename = wordFileNames[i].replace(WORD_EXTNAME, "");

        expect(currentCodeFilename).toBe(currentWordFilename);
      }
    });
  });

  describe("given that word and pdf files are generated from the respective code files", () => {
    it("should match corresponding file content for code and word", async () => {
      for (let i = 0; i < codeFilenames.length; i++) {
        const currentCodeFilename = codeFilenames[i];
        const currentWordFilename = wordFileNames[i];

        try {
          const currentCodeFilepath = path.join(
            CODE_DIR_PATH,
            currentCodeFilename
          );
          const currentWordFilepath = path.join(
            WORD_DIR_PATH,
            currentWordFilename
          );

          let codeContent = await fs.promises.readFile(currentCodeFilepath, {
            encoding: "utf-8",
          });

          //missing ESC symbol "\x1b" -> "\u241b"
          codeContent = codeContent.replace(/\x1b/g, "\u241b");

          const wordContent = await mammoth.extractRawText({
            path: currentWordFilepath,
          });

          // strip whitespaces
          const cleanedWordContent = replaceWhitespace(wordContent.value);
          const cleanedCodeContent = replaceWhitespace(codeContent);

          const titleRegex = new RegExp(
            "^\\/\\/" + currentCodeFilename + "(.*)"
          );

          expect(cleanedWordContent).toMatch(titleRegex);

          const wordMatched = cleanedWordContent.match(titleRegex);
          const wordTextAfterTitle = wordMatched[1];

          if (wordMatched && wordTextAfterTitle) {
            expect(wordTextAfterTitle).toBe(cleanedCodeContent);
          } else {
            throw new Error("Title NOT found or NO text after title; Word.");
          }
        } catch (error) {
          console.error(
            `Error from files: Code "${path.join(
              CODE_DIR_PATH,
              currentCodeFilename
            )}" + Word "${currentWordFilename}"`
          );

          throw error;
        }
      }
    });

    //skip in CI
    (isInCIEnv ? it.skip : it)(
      "should match corresponding file content for word and pdf",
      async () => {
        for (let i = 0; i < wordFileNames.length; i++) {
          const currentWordFilename = wordFileNames[i];
          const currentPdfFilename = pdfFileNames[i];
          try {
            const currentWordFilepath = path.join(
              WORD_DIR_PATH,
              currentWordFilename
            );

            const currentPdfFilepath = path.join(
              PDF_DIR_PATH,
              currentPdfFilename
            );

            const wordContent = await mammoth.extractRawText({
              path: currentWordFilepath,
            });

            const { yCoordinates, texts } = await parsePdf(currentPdfFilepath);
            const minY = Math.min.apply(null, yCoordinates);
            const pdfContent = composeTextFromPdf(minY, texts);

            // strip whitespaces
            const cleanedWordContent = replaceWhitespace(wordContent.value);
            const cleanedPdfContent = replaceWhitespace(pdfContent);

            expect(cleanedWordContent).toBe(cleanedPdfContent);
          } catch (error) {
            console.error(
              `Error from files: Word "${path.join(
                WORD_DIR_PATH,
                currentWordFilename
              )}" + Pdf "${currentPdfFilename}"`
            );

            throw error;
          }
        }

        //5.1417306 sec for #40 files
      },
      10000
    );
  });
});
