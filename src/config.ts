import * as vscode from "vscode";
const defaultConfig = {
  importName: `import { useTranslators } from "commonUse/Locale";`,
  functionName: "$sst",
  intlFile: "local_en.ts",
  intlDir: "",
};

export let config = { ...defaultConfig };

export function getPluginConfig() {
  const keys = Object.keys(defaultConfig);
  const _config = {};
  const pluginConfig = vscode.workspace.getConfiguration("i18Translate");
  keys.forEach((key) => {
    const value = pluginConfig.get(key);
    if (value) {
      _config[key] = value;
    }
  });
  config = { ...config, ..._config };
}
