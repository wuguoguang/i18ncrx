import * as vscode from "vscode";

import transform from "./translate";

export async function commandEvent(val: any) {
  const dd = vscode.window.activeTextEditor?.document.fileName;
  const code = vscode.window.activeTextEditor?.document.getText();
  if (!code) return;
  const transformCode = await transform(code);
  vscode.window.showInformationMessage(dd || "");

  vscode.window.activeTextEditor?.edit((edit) => {
    if (
      vscode?.window?.activeTextEditor &&
      vscode.window.activeTextEditor.document.lineCount
    ) {
      const endLine = new vscode.Position(
        vscode.window.activeTextEditor?.document.lineCount,
        0
      );
      return edit.replace(
        new vscode.Range(new vscode.Position(0, 0), endLine),
        transformCode || ""
      );
    }
  });
}
