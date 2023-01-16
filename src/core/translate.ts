//@ts-nocheck
import { transformSync } from "@babel/core";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generator from "@babel/generator";
import * as t from "@babel/types";

function isChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}

const zhData = {};
/**
 * 替换为 intl.get('xxxxxxxx').d('基本信息')
 */
function makeReplace({ value, variableObj, id }) {
  let key = id;

  // 用于防止中文转码为 unicode
  const v = Object.assign(t.StringLiteral(value), {
    extra: {
      raw: `'${value}'`,
      rawValue: value,
    }, 
  });

  return t.CallExpression(t.Identifier("$st"), [
    typeof key === "string" ? t.StringLiteral(key) : key, 
  ]);
  //   return t.CallExpression(
  //     t.MemberExpression(
  //       t.CallExpression(
  //         t.MemberExpression(t.Identifier("$st"),t.Identifier("sst")),
  //         [typeof key === "string" ? t.StringLiteral(key) : key]
  //         // variableObj
  //         //   ? [typeof key === "string" ? t.StringLiteral(key) : key, variableObj||{}]
  //         //   : [typeof key === "string" ? t.StringLiteral(key) : key]
  //       ),
  //       t.Identifier("d")
  //     ),
  //     [v]
  //   );
}

const log = {
  info: console.log,
};
export default async function transformCode(source, outObj = {}) {
  const cache = {};
  function handleChinese(value, key) {
    cache[key] = true;
    return Object.assign(t.stringLiteral(value), {
      extra: {
        raw: `'${value}'`,
        rawValue: value,
      },
    });
  }
  try {
    const ast = parse(source, {
      plugins: ["typescript", "jsx", "optionalChaining"],
      sourceType: "module",
    });

    traverse(ast, {
      //   ImportDeclaration(path) {
      //     const { node } = path;
      //     if (node.source.value === "react") {
      //       outObj.hasReactIntlUniversal = true;
      //     }
      //     if (node.source.value === "react") {
      //       outObj.needRewrite = true;
      //       log.info("remove: injectIntl");
      //       path.remove();
      //     }
      //   },
      // 装饰器
      Decorator(path) {
        const { node } = path;
        // if (node.expression.name === "injectIntl") {
        //   outObj.needRewrite = true;
        //   log.info("remove: injectIntl decorator");
        //   path.remove();
        // }
      },
      //   BinaryExpression(path) {
      //     const { node } = path;

      //     // 替换类似 this.props.intl.locale === 'en' 为 intl.options.currentLocale === 'en-US'
      //     if (
      //       node.operator === "===" &&
      //       node.right.type === "StringLiteral" &&
      //       node.right.value === "en" &&
      //       node.left.type === "MemberExpression"
      //     //   node.left.property.name === "locale"
      //     ) {
      //       outObj.needRewrite = true;
      //       log.info("replace intl.locale === 'en'");

      //       node.left = t.MemberExpression(
      //         t.memberExpression(t.identifier("intl"), t.identifier("options")),
      //         t.identifier("currentLocale")
      //       );
      //       node.right = t.stringLiteral("en-US");
      //     }
      //   },
      //   ObjectPattern(path) {
      //     const { node } = path;

      //     const parent = path.parent;
      //     if (!parent.init) {
      //       return;
      //     }

      //     if (
      //       (parent.init.type === "Identifier" && parent.init.name === "props") ||
      //       (parent.init.type === "MemberExpression" &&
      //         parent.init.property.name === "props")
      //     ) {
      //       // 处理掉 let { params, intl } = this.props; 中的 intl
      //       log.info("remove: this.props.intl");
      //       node.properties = node.properties.filter(
      //         (p) => !p.value || p.value.name !== "intl"
      //       );
      //     }
      //   },
      JSXText(path) {
        if (!isNaN(path.node.value) || /\n/.test(path.node.value)) {
          return;
        }

        path.replaceWith(
            t.jsxExpressionContainer(makeReplace({ value: path.node.value, id: path.node.value }))
        );
      },

    //   JSXExpressionContainer(path){
    //     path.replaceWith(
    //         makeReplace({ value: path.node.expression.value, id: path.node.expression.value })
    //     );
    //   },
      JSXElement(path) {
        const { node } = path;
        const { openingElement } = node;
        if(node.children.length>1||node.children?.[0]?.type==='JSXElement'){
            return;
        }
        if (openingElement.name.name === "div") {
            
            const id = "test";
            // const valuesNode = openingElement.attributes.find(
            //   (atr) => atr.name.name === "values"
            // );
            
            
            let callExpression;
            callExpression = makeReplace({
                value: "TBD",
                id: id,
              });
            // if (valuesNode) {
            //   callExpression = makeReplace({
            //     value: zhData[id] || "TBD",
            //     id: id,
            //     variableObj: valuesNode.value.expression,
            //   });
            // } else {
            //   callExpression = makeReplace({
            //     value: "TBD",
            //     id: id,
            //   });
            // }
            if (path.parent.type === "JSXExpressionContainer") {
              path.replaceWith(callExpression);
            } else if (path.parent.type === "JSXElement") {
              path.replaceWith(t.jsxExpressionContainer(callExpression));
            } else {
              path.replaceWith(callExpression);
            }
        }
      },
      //   StringLiteral(path) {
      //     const { node } = path;
      //     const { value } = node;
      //     const key = value + node.start + node.end;
      //     if (isChinese(value) && !cache[key]) {
      //       if (path.parent.type === "JSXAttribute") {
      //         path.replaceWith(handleChinese(value, key));
      //       }
      //     }
      //   },
      //   CallExpression(path) {
      //     const { node } = path;

      //     const handleFormatMessageMethod = () => {
      //       const id = node.arguments[0].properties.find(
      //         (prop) => prop.key.name === "id"
      //       ).value.value;
      //       outObj.needRewrite = true;

      //       log.info(`replace: ${id}`);

      //       if (node.arguments.length === 1) {
      //         path.replaceWith(
      //           makeReplace({ value: zhData[id] || "TBD", id: id })
      //         );
      //       } else {
      //         path.replaceWith(
      //           makeReplace({
      //             value: zhData[id] || "TBD",
      //             id: id,
      //             variableObj: node.arguments[1],
      //           })
      //         );
      //       }
      //     };

      //     if (node.callee.type === "MemberExpression") {
      //       if (node.callee.property.name === "formatMessage") {
      //         if (
      //           (node.callee.object.property &&
      //             node.callee.object.property.name === "intl") ||
      //           (node.callee.object.type === "Identifier" &&
      //             node.callee.object.name === "intl")
      //         ) {
      //           handleFormatMessageMethod();
      //         }
      //       }
      //     } else {
      //       if (node.callee.name === "formatMessage") {
      //         handleFormatMessageMethod();
      //       } else if (node.callee.name === "injectIntl") {
      //         outObj.needRewrite = true;
      //         path.replaceWith(node.arguments[0]);
      //       }
      //     }
      //   },
    });

    let { code } = generator(
      ast,
      { retainLines: true, decoratorsBeforeExport: true },
      source
    );
    return code;
  } catch (error) {
    console.log(error);
  }

  //   const ast = await transformSync(code, {
  //     presets: ["@babel/preset-env", "@babel/preset-react"],
  //   });
}
