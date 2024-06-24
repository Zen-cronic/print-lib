const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const express = require("express");
const { printLib, WORD_DIR_PATH } = require("print-lib");

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());

//curl http://localhost:5000/healthcheck
app.get("/healthcheck", (req, res) => {
  const sampleEnv = process.env.SAMPLE;
  console.log({ sampleEnv });
  return res.status(200).send("Healthy");
});

// curl http://localhost:5000/v1

// test download dir/recursive files:
// curl --output word-server.zip  http://localhost:5000/v1

// test single file
// curl -O -J http://localhost:5000/v1

app.get("/v1", async (req, res) => {
  //ApiOpts
  //   link: string;
  // linkType: "file" | "dir" | "recursive";
  // auth: string;
  // userAgent: string;
  // convertTo: "word" | "pdf";

  const opts = {};

  //fixed
  opts["convertTo"] = "word";

  //dev

  // recursive
  // opts["link"] = "https://github.com/mwilliamson/mammoth.js/tree/master/lib";
  // opts["linkType"] = "recursive";

  // singleFile
  opts["link"] =
    "https://github.com/mwilliamson/mammoth.js/blob/master/lib/document-to-html.js";
  opts["linkType"] = "file";

  opts["auth"] = process.env.API_ACCESS_TOKEN;
  opts["userAgent"] = "Zen-cronic";
  try {
    //stub while dev test
    await printLib(opts);

    //send zip "dir|recursive" (or) singleFile "file" .docx

    let resDownloadPath;

    switch (opts.linkType) {
      case "file":
        const [singleDocxFile] = await fs.promises.readdir(WORD_DIR_PATH);

        const singleDocxFilePath = path.join(WORD_DIR_PATH, singleDocxFile);

        resDownloadPath = singleDocxFilePath;
        break;

      case "dir":
      case "recursive":

        const outPathAbs = path.resolve(process.cwd(), "word.zip");

        const srcPathBase = path.basename(WORD_DIR_PATH);

        await zipDir(srcPathBase, outPathAbs);

        resDownloadPath = outPathAbs;
        break;

      default:
        //error - handled by printLib & front 
        break;
    }

    return res.status(200).download(resDownloadPath);
  } catch (error) {
    console.error("Error calling printLib:\n", error);
    return res.status(500).send("Error processing request");
  }
});

/**
 * Create zip files for 'dir' and 'recursive' linkType from the 'word' directory
 * @param {string} srcPath - The source path to convert to .zip (relative only)
 * @param {string} outPath - The dist path to store the converted files 
 */
async function zipDir(srcPath, outPath) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const writeStream = fs.createWriteStream(outPath);

  const archivePromise = new Promise((resolve, reject) => {
    archive
      // 2nd arg to directory()
      // undefined: same dir name in archive
      // false: all files at the root of archive
      .directory(srcPath)
      .on("error", (err) => reject(err))
      .pipe(writeStream);

    archive
      .finalize()
      .then(() => resolve())
      .catch((err) => reject(err));
  });

  const writeStreamPromise = new Promise((resolve, reject) => {
    writeStream.on("error", (err) => reject(err));
    writeStream.on("close", () => resolve());
  });

  await Promise.all([archivePromise, writeStreamPromise]);
}

app.listen(PORT, () => {
  console.log(`Server listening on PORT ${PORT}`);
});
