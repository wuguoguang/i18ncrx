import * as vscode from "vscode";
import path from "path";
import transform from "./translate";
import writeFileWithKeys from "./writeFile";
import { getFullPath } from "./util";
import fs from "fs";
import { config } from "../config";

export async function commandEvent() {
  const filePath = vscode.window.activeTextEditor?.document.fileName;
  const code = vscode.window.activeTextEditor?.document.getText();
  const isTsx = [".ts", ".tsx"].includes(path.extname(filePath || ""));
  if (!code) return;
  const transformCode = await transform({
    sourceCode: code,
    isTsx,
    configOption: config,
  });
  if (transformCode.isRewriting) {
    let isWrite = await writeFileWithKeys(
      getFullPath(config.intlDir, config.intlFile),
      transformCode.allTranslateWord
    );
    if (!isWrite) return;
  }

  vscode.window.activeTextEditor?.edit((edit) => {
    if (
      vscode?.window?.activeTextEditor &&
      vscode.window.activeTextEditor.document.lineCount
    ) {
      const endLine = new vscode.Position(
        vscode.window.activeTextEditor?.document.lineCount,
        0
      );
      if (transformCode.isRewriting) {
        vscode.window.showInformationMessage("rewrite  successful");
        return edit.replace(
          new vscode.Range(new vscode.Position(0, 0), endLine),
          transformCode.code || ""
        );
      }
      return;
    }
  });
}

export function registerCommandTranslate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("wgg.helloWorld", commandEvent)
  );
}

export function provideDefinition(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken
) {
  const word = document.getText(document.getWordRangeAtPosition(position));
  const line = document.lineAt(position).text;
  const matchWord = line.includes(`${config.functionName}("${word}`);
  const path = getFullPath(config.intlDir, config.intlFile);
  if (!path) return;
  const file = fs.readFileSync(path);
  const lineCode = file.toString("utf-8").split("\n");
  let index = 0;
  for (let i = 0; i < lineCode.length; i++) {
    let code = lineCode[i];
    if (code.trim().startsWith(word)) {
      index = i;
      break;
    }
  }
  if (matchWord) {
    return new vscode.Location(
      vscode.Uri.file(path),
      new vscode.Position(index, 4)
    );
  }
}

export function registerJump(context: vscode.ExtensionContext) {
  const sel = { scheme: "file", pattern: "**/*.{js,jsx,ts,tsx,vue}" };
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(sel, {
      provideDefinition,
    })
  );
}
