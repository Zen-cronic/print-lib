const path = require("path");
const fs = require("fs");

const { printLib, CODE_DIR_PATH, WORD_DIR_PATH } = require("../../index");

describe("printLib", () => {
  describe("given ", () => {
    it("should create corresponding files in WORD_DIR in the same order (created with sync)", async () => {
      await printLib();

      //ltr: shallow copy?
      const codeFilenames = fs.readdirSync(CODE_DIR_PATH, {
        encoding: "utf-8",
      });
      const wordFileNames = fs.readdirSync(WORD_DIR_PATH, {
        encoding: "utf-8",
      });

      const wordExtname = ".docx";

      //   console.log(codeFilenames);
      //   console.log(wordFileNames);

      expect(codeFilenames.length).toBe(wordFileNames.length);

      

      for (let i = 0; i < codeFilenames.length; i++) {
        //remove extname for each file in both arr
        const codeExtname = path.extname(codeFilenames[i]);
        codeFilenames[i] = codeFilenames[i].replace(codeExtname, "");

        //or in abv map
        wordFileNames[i] = wordFileNames[i].replace(wordExtname, "");

        expect(codeFilenames[i]).toBe(wordFileNames[i]);
      }

    });
  });

  describe('given another', () => { 
    it('should return', () => { 
        
     })
   })
});
