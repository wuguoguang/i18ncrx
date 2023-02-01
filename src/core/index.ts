import * as vscode from "vscode";
import path from "path";
import transform from "./translate";
import writeFile from "./writeFile";
import { getFullPath } from "./util";
import fs from "fs";

const config = {
  importName: `import { useTranslators } from "commonUse/Locale";`,
  functionName: "$sst",
  intlFile: "local_en.ts",
  intlDir: "",
};

export async function commandEvent(val: any) {
  const filePath = vscode.window.activeTextEditor?.document.fileName;
  const code = vscode.window.activeTextEditor?.document.getText();
  const isTsx = [".ts", ".tsx"].includes(path.extname(filePath || ""));
  if (!code) return;
  const transformCode = await transform({ sourceCode: code, isTsx });

  if (transformCode.isRewriting) {
    await writeFile(
      getFullPath(config.intlDir, config.intlFile),
      transformCode.allTranslateWord
    );
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

export function provideDefinition(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken
) {
  const word = document.getText(document.getWordRangeAtPosition(position));
  const line = document.lineAt(position).text;
  const matchWord = line.includes(`${config.functionName}("${word}`);
  const fileName = document.fileName;

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
