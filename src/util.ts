export const supportedLanguageIds = [
    'javascript',
    'typescript',
    'typescriptreact',
    'javascriptreact',
    'json',
    'html',
    'css',
    'scss',
    'less',
    'vue',
  ];

  export const configurationKey = 'ast';


  const chalk = require('chalk');

export const log = {
  info: (msg: any) => console.log(chalk.cyan(msg)),
  warning: (msg: any) => console.log(chalk.yellow(msg)),
  success: (msg: any) => console.log(chalk.green(msg)),
  error: (msg: any) => console.log(chalk.red(msg)),
};
