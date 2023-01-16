// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { supportedLanguageIds ,configurationKey} from './util';
import { commandEvent } from './core';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

type Config = {
    // highlightConfig: Partial<vscode.DecorationRenderOptions>;
    reuseWebview: boolean;
    hideEditorTitleButton: boolean;
  };

const defaultConfig: Config = {
    reuseWebview: false,
    hideEditorTitleButton: false,
  };
  let config: Config =  JSON.parse(JSON.stringify(defaultConfig)) ;

  // configuration updated
  vscode.workspace.onDidChangeConfiguration((e) => {
    // @ts-ignore
    // const newConfig = vscode.workspace.getConfiguration(
    //   configurationKey
    // ) as Config;

    // config = merge(cloneDeep(defaultConfig), newConfig);

    // highlightDecorationType = vscode.window.createTextEditorDecorationType(
    //   config.highlightConfig
    // );
    updateContext();
  });




 function updateContext() {
    // register context used in package.json editor/title
     vscode.commands.executeCommand(
      'setContext',
      `wgg.supportedLanguageIds`,
      supportedLanguageIds
    );
 }


export async function activate(context: vscode.ExtensionContext) {

    updateContext();
     console.log(context);
     
    
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "p" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

    let time = vscode.commands.registerCommand('wgg.helloWorld',commandEvent);

    context.subscriptions.push(time);
}

// This method is called when your extension is deactivated
export function deactivate() {}
