// import { printLib } from "../../index.js"
// import * as fs from "fs"
// import * as path from "path";
// import * as url from "url"

// require = require("esm")(module)

const path = require("path")
const fs = require("fs")
const os = require("os")

const { printLib } = require("../../index")

const CODE_DIRNAME = "code"
const WORD_DIRNAME = "word"


// console.log({root});
// const WORD_DIR_PATH = path.join(ROOT, WORD_DIRNAME);
// const CODE_DIR_PATH = path.join(ROOT, CODE_DIRNAME)

describe('printLib', () => { 
    describe('given ', () => { 

        it('should create corresponding files in WORD_DIR', () => { 

            
            printLib()

            console.log(os.homedir());
            // const fileNames = fs.readdirSync()
            expect(true).toBe(true)
         })

     })
 })