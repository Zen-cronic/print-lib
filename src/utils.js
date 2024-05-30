

module.exports = {transformUrlStr}
/**
 *
 * @param {string | URL} url
 */
function transformUrlStr(url) {
    if (typeof url !== "string" && !(url instanceof URL)) {
      throw new TypeError(
        `Param must be of type string or URL; Received object: ${url} of type ${typeof url}`
      );
    }
  
    if (typeof url === "string") {
      url = new URL(url);
    }
  
    if (url.hostname !== "github.com") {
      throw new Error(
        `Only support repos from github.com; Received hostname '${url.hostname}'`
      );
    }
  
    const urlPathname = url.pathname;
  
    const parts = urlPathname.split("/").filter(Boolean);
  
    const owner = parts[0];
    const repoName = parts[1];
    const repoPath = parts.slice(4).join("/");
  
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${repoPath}`;
  
    return apiUrl;
  }