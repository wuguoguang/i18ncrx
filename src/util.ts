import { posix } from "path";
const  requireFromString =require("require-from-string")
import * as vscode from "vscode";
export const supportedLanguageIds = [
  "javascript",
  "typescript",
  "typescriptreact",
  "javascriptreact",
  "json",
  "html",
  "css",
  "scss",
  "less",
  "vue",
];

export const configurationKey = "ast";

const chalk = require("chalk");

export const log = {
  info: (msg: any) => console.log(chalk.cyan(msg)),
  warning: (msg: any) => console.log(chalk.yellow(msg)),
  success: (msg: any) => console.log(chalk.green(msg)),
  error: (msg: any) => console.log(chalk.red(msg)),
};

export async function getFileContent(rootFilePath:string) {
  const folderUri = vscode.workspace.workspaceFolders?.[0]?.uri;
  const fileUri = folderUri?.with({
    path: posix.join(folderUri.path, rootFilePath),
  });
  if (fileUri) {
    const readData = await vscode.workspace.fs.readFile(fileUri);
    const readStr = Buffer.from(readData).toString("utf8");
    return readStr;
  }
  return;
}

export async function getContentVal(rootFilePath:string) {
  const val = await getFileContent(rootFilePath);
  return val?requireFromString(val):val;
}
