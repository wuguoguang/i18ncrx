// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { supportedLanguageIds, configurationKey, getContentVal } from './core/util';
import { commandEvent, registerJump, registerCommandTranslate } from './core';
import { getPluginConfig } from './config';

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
    getPluginConfig();
    // register context used in package.json editor/title
    vscode.commands.executeCommand(
        'setContext',
        `wgg.supportedLanguageIds`,
        supportedLanguageIds
    );
}


export async function activate(context: vscode.ExtensionContext) {
    updateContext();
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "p" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    registerJump(context);
    registerCommandTranslate(context);
}


// This method is called when your extension is deactivated
export function deactivate() {
    console.log("插件已释放");

}
