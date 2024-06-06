const path = require("path");
const fs = require("fs");
const mammoth = require("mammoth");
const { printLib, CODE_DIR_PATH, WORD_DIR_PATH } = require("../../src");
const { replaceWhitespace } = require("../../src/utils");

describe("printLib", () => {
  let codeFilenames;
  let wordFileNames;
  const wordExtname = ".docx";

  beforeAll(async () => {

    const url = "https://github.com/mwilliamson/mammoth.js/tree/master/lib";

    await printLib(url, {
      dir: true,
      recursive: true,
    });

    //ENOENT if invoked b4 printLib finished
    codeFilenames = fs.readdirSync(CODE_DIR_PATH, {
      encoding: "utf-8",
    });
    wordFileNames = fs.readdirSync(WORD_DIR_PATH, {
      encoding: "utf-8",
    });
  }, 15000);

  describe("given ", () => {
    it("should create corresponding files in WORD_DIR in the same order (created with sync)", async () => {
      expect(codeFilenames.length).toBe(wordFileNames.length);

      for (let i = 0; i < codeFilenames.length; i++) {

        const codeExtname = path.extname(codeFilenames[i]);

        const currentCodeFilename = codeFilenames[i].replace(codeExtname, "");
        const currentWordFilename = wordFileNames[i].replace(wordExtname, "");

        expect(currentCodeFilename).toBe(currentWordFilename);
      }
    });
  });

  describe("given another", () => {
    it("should match corresponding file content", async () => {
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

          //missing ESC symbol "\x1b" -> "\u241b"
          const codeContent = fs
            .readFileSync(currentCodeFilepath, {
              encoding: "utf-8",
            })
            .replace(/\x1b/g, "\u241b");

          const wordContent = await mammoth.extractRawText({
            path: currentWordFilepath,
          });

          const cleanedWordContent = replaceWhitespace(wordContent.value)
          const cleanedCodeContent = replaceWhitespace(codeContent)

          const titleRegex = new RegExp(
            "^\\/\\/" + currentCodeFilename + "(.*)"
          );

          expect(cleanedWordContent).toMatch(titleRegex);

          const matched = cleanedWordContent.match(titleRegex);
          const textAfterTitle = matched[1];
          
          if (matched && textAfterTitle) {
            expect(textAfterTitle).toBe(cleanedCodeContent);
          } else {
            throw new Error("Title NOT found or NO text after title.");
          }
        } catch (error) {
          console.error(
            `Error from files: Code "${path.join(
              CODE_DIR_PATH,
              currentCodeFilename
            )}" + Word "${currentWordFilename}"`
          );

          //DNW
          // error.message = `Error from files: ${currentCodeFilename} + ${currentWordFilename}:\n${error.message}`;

          throw error;
        }
      }
    });
  });
});
