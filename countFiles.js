const fs = require("fs")
const { CODE_DIR_PATH } = require("./src")
// /lib

//expected 42, received 39 - 4 duplicates, 1 root file
//expected 42, received 41 - the first non-root file ignored

const files = fs.readdirSync(CODE_DIR_PATH, {encoding: "utf-8"})
console.log(files.length);

