# print-lib

# What it does

Print a GitHub repository's code as **.docx** or **.pdf** files.

# Why?

When diving into a codebase, I like to have physical copies of the source code. It's easier on my eyes - especially after a long day of programming screen time.

Before, I'd manually copy and paste the content of a code file into MS Word, attach page numbers and a title (filename), and then convert it into pdf (using Word or online tools, etc.). Not much of an issue at all. Until the file count grew. Even repeating those steps for more than a few files felt ... _hard-coded_.

This is my attempt to automate the menial process. Of course, screen time is inevitable to a programmer (and non-coders alike). So, this solution may seem like a drop in the ocean, but hopefully more folks will come to appreciate physical source code study.

# Installation

1. `$ npm install print-lib`
2. `$ pip install -r node_modules/print-lib/requirements.txt`

# Requirements 

- `python >= 3.8`
- `Nodejs >= 14`
- MS Word installed on local machine (needed for `.pdf` conversion)

# Example

```javascript
const { printLib } = require("print-lib");

(async () => {

  const url = "https://github.com/Zen-cronic/scope-logger/tree/main/src";

  await printLib({
    link: url,
    linkType: "recursive",
    auth: process.env.API_ACCESS_TOKEN,
    userAgent: "Zen-cronic",
    convertTo: "pdf",
  });
})();

```

**Output:**

Prints 3 directories in the root:

1. The **code** files in `code` 

2. The **.docx** files in `word`

3. The **.pdf** files in `pdf` (This is optional; see the `Configuring Options` section )

# Configuring options 

All are required. 

1. `link <string>`: A valid github repository url

2. `linkType <"file"|"dir"|"recursive">`: The type of the content represented by the `link`. 
     - A. `file`: A single source code file. For example, the link represents `index.js` only.

     - B. `dir`: All the files in the given directory. Ignores files in sub-directories.

     - C. `recursive`: Recursively traverse all files in a given directory, including sub-directories. 

3. `auth`: The GitHub API token needed to make the requests to fetch repository content. Without this, the rate limit is very low. **Fine-grain access tokens** are recommended.  Check the `Resources` section for more information.

4. `userAgent`: Your GitHub username or the name of your GitHub App. 

5. `convertTo <"word"|"pdf">`: The stage of the file conversions. 
    
    - A. `word`: Generate `.docx` files from the files in `code` directory. Works cross-platform.

    - B. `pdf`: Generate `.pdf` files from the files in `word` directory. Only available on machines with MS Word installed. Therefore, it cannot be used on linux. If your local machine is **not** running on Windows or MacOS **and** this option is set, it fallbacks to `word`.

# Dependencies

-  **0 javascript/nodejs dependency!**
-  `python-docx` for `.docx` conversion
-  `docx2pdf` for `.pdf` conversion


# Test
Uses dynamic imports in testing with jest. Therefore, the `--experimental-vm-modules` flag must be set. 

`$ npm run test:dynamic`

# Resources 

- [GitHub Content API](https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content)
- [GitHub API rate limit](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28)


