const path = require("path");
const srcPath = path.join(__dirname, "../draft-js/");
const tsConfigPath = path.join(srcPath, "tsconfig.json");
const mainPath = path.join(srcPath, "index.js");
const templatePath = path.join(srcPath, "index.html");
const appPath = path.join(__dirname, "../");
const port = 8080;

module.exports = {
  srcPath,
  tsConfigPath,
  mainPath,
  templatePath,
  appPath,
  port,
};
