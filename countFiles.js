const fs = require("fs")
const { CODE_DIR_PATH } = require("./src")
// /lib

//expected 42, received 39
const files = fs.readdirSync(CODE_DIR_PATH, {encoding: "utf-8"})
console.log(files.length);

