const path = require("path");
const fs = require("fs");
const mammoth = require("mammoth");


const { printLib, CODE_DIR_PATH, WORD_DIR_PATH } = require("../../index");

// @workspace the Corrupted zip: can't find end of central directory error is thrown from the jszip library upon restarting the test suite immediately after an initial run. But if you wait long enough, there's no error

describe("printLib", () => {
  beforeAll(async () => {
    //run code first
    await printLib();
  });

  const codeFilenames = fs.readdirSync(CODE_DIR_PATH, {
    encoding: "utf-8",
  });
  const wordFileNames = fs.readdirSync(WORD_DIR_PATH, {
    encoding: "utf-8",
  });

  const wordExtname = ".docx";

  describe("given ", () => {
    it("should create corresponding files in WORD_DIR in the same order (created with sync)", async () => {
      //   console.log(codeFilenames);
      //   console.log(wordFileNames);

      expect(codeFilenames.length).toBe(wordFileNames.length);

      for (let i = 0; i < codeFilenames.length; i++) {
        //remove extname for each file in both arr
        const codeExtname = path.extname(codeFilenames[i]);

        const currentCodeFilename = codeFilenames[i].replace(codeExtname, "");
        const currentWordFilename = wordFileNames[i].replace(wordExtname, "");

        expect(currentCodeFilename).toBe(currentWordFilename);
      }
    });
  });

  describe("given another", () => {
    it("should match corresponding file content", async () => {
      // console.log(codeFilenames);
      // console.log(wordFileNames);

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

          //X=*�'�I¶a<�|...
          // const wordContent = fs.readFileSync(currentWordFilepath, {encoding: "utf-8"});

          expect(wordContent.value.replace(/\s/g, "")).toBe(
            codeContent.replace(/\s/g, "")
          );
        } catch (error) {
          console.error(
            `Error from files: ${currentCodeFilename} + ${currentWordFilename}`
          );

          //DNW
          // error.message = `Error from files: ${currentCodeFilename} + ${currentWordFilename}:\n${error.message}`;

          throw error;
        }
      }
      expect(true).toBe(true);
    });
  });
});
