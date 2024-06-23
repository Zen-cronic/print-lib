const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const express = require("express");
const { printLib } = require("print-lib");

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
// test download files:  curl --output word-server.zip  http://localhost:5000/v1
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
  opts["link"] = "https://github.com/mwilliamson/mammoth.js/blob/master/lib/document-to-html.js";
  opts["linkType"] = "file";
  opts["auth"] = process.env.API_ACCESS_TOKEN;
  opts["userAgent"] = "Zen-cronic";
  try {
    //stub while dev test
    // await printLib(opts);

    //send zip "dir|recursive" (or) singleFile "file" .docx

    let resDownloadPath;

    switch (opts.linkType) {
      //res.download(file)
      case "file":


        break;

      case "dir":
      case "recursive":
        //send zip of word dir

        const outPathAbs = path.join(__dirname, "word.zip");
        const srcPathAbs = path.join(__dirname, "word");

        if (!fs.existsSync(srcPathAbs)) {
          throw new Error(
            `Path Does Not Exist for zip conversion: ${srcPathAbs}`
          );
        }

        const srcPathBase = path.basename(srcPathAbs);

        await zipDir(srcPathBase, outPathAbs);

        resDownloadPath = outPathAbs;
        break;

      default:
        //error
        break;
    }

    return res.status(200).send("File gen success!").download(resDownloadPath);
    // return res.status(200).send("File gen success!");
  } catch (error) {
    console.error("Error calling printLib:\n", error);
    return res.status(500).send("Error processing request");
  }
});

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
