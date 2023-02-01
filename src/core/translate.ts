import * as prettier from "prettier";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generator from "@babel/generator";
import pluginFun from "./plugin/rjsx";
import { getContentVal } from "../util";

async function translate({ sourceCode }: { sourceCode: string }) {
  const prettierConfig = await getContentVal(".prettierrc.js");
  const arg = {
    translateWordsNum: 0,
    hasImportModule: false,
  };
  const plugin = pluginFun({}, () => "test", arg);
  const sourceAst = parse(sourceCode, {
    plugins: ["typescript", "jsx", "optionalChaining"],
    sourceType: "module",
  });
  traverse(sourceAst, {
    ...plugin().visitor,
  });
  const { translateWordsNum, hasImportModule } = arg;
  let code = sourceCode;
  //   if (translateWordsNum !== 0) {
  //     code = generator(sourceAst, {
  //       retainLines: true,
  //       decoratorsBeforeExport: true,
  //       jsescOption: {
  //         minimal: true,
  //       },
  //     }).code;
  //     if (!hasImportModule) {
  //       code = "import intl from 'react-intl-universal';\n" + code;
  //     }
  //   }

  code = generator(sourceAst, {
    retainLines: true,
    decoratorsBeforeExport: true,
    jsescOption: {
      minimal: true,
    },
  }).code;
//   try {
//     const { overrides, ...con } = prettierConfig;
//     prettier.format(code);
//   } catch (error) {
//     console.log(error);
//   }

  return {
    isRewriting: translateWordsNum !== 0,
    code: translateWordsNum !== 0 ? prettier.format(code) : sourceCode,
  };
}

export default translate;
