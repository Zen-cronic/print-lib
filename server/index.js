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
app.get("/v1", async (req, res) => {
  //ApiOpts
  //   link: string;
  // linkType: "file" | "dir" | "recursive";
  // auth: string;
  // userAgent: string;
  // convertTo: "word" | "pdf";

  //  const opts = req.body;
  const opts = {};

  //fixed
  opts["convertTo"] = "word";

  //dev
  opts["link"] = "https://github.com/mwilliamson/mammoth.js/tree/master/lib";
  opts["linkType"] = "recursive";
  opts["auth"] = process.env.API_ACCESS_TOKEN;
  opts["userAgent"] = "Zen-cronic";
  try {
    await printLib(opts);
    //send zip (or) singleFile
    return res.status(200).send("File gen success!");
  } catch (error) {
    console.error("Error calling printLib:\n", error);
    return res.status(500).send("Error processing request");
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on PORT ${PORT}`);
});
