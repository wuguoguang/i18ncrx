import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generator from "@babel/generator";
import makePluginWithVisitor from "./plugin/rjsx";
import { prettierCode, makeRandomFunctionNameStr } from "./util";

type ConfigOption = {
  importName: string;
  functionName: string;
};

const _configOption = {
  importName: `import { useTranslators } from "commonUse/Locale";`,
  functionName: "$sst",
};

async function translate({
  sourceCode,
  isTsx,
  configOption,
}: {
  sourceCode: string;
  isTsx: boolean;
  configOption?: ConfigOption;
}) {
  const args = {
    translateWordsNum: 0,
    hasImportModule: false,
  };
  const mergedOption = { ..._configOption, ...(configOption || {}) };

  const allTranslateWord = {};
  const plugin = makePluginWithVisitor(
    allTranslateWord,
    makeRandomFunctionNameStr,
    args,
    { functionName: mergedOption.functionName }
  );
  const sourceAst = parse(sourceCode, {
    plugins: ["typescript", "jsx", "optionalChaining"],
    sourceType: "module",
  });

  traverse(sourceAst, {
    ...plugin().visitor,
  });
  const { translateWordsNum, hasImportModule } = args;
  let code = sourceCode;
  if (translateWordsNum !== 0) {
    code = generator(sourceAst, {
      retainLines: true,
      decoratorsBeforeExport: true,
      jsescOption: {
        minimal: true,
      },
    }).code;
    if (!hasImportModule) {
      code =mergedOption.importName + code;
    }
  }

  console.log("allTranslateWord",allTranslateWord);
  
  const parser = isTsx ? "typescript" : "babel";

  return {
    isRewriting: translateWordsNum !== 0,
    allTranslateWord,
    code:
      translateWordsNum !== 0
        ? await prettierCode(code, { parser })
        : sourceCode,
  };
}

export default translate;
