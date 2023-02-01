import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

// const replaceLineBreak = function (value) {
//   if (typeof value !== "string") {return value;}
//   return value.replace(/\n/g, " ");
// };

const baseType = function (v: any) {
  return Object.prototype.toString.call(v);
};

// const judgeChinese = function (text) {
//   return /[\u4e00-\u9fa5]/.test(text);
// };

function reactPlugin(
  allTranslateWord: { [key in string]: any },
  randomStr: any,
  arg: any
) {
  function makeReplace({
    value,
    variableObj,
  }: {
    value: string;
    variableObj?: { [key in string]: any };
  }) {
    arg.translateWordsNum++;
    let key: string = value || randomStr();
    const val = value;
    if (allTranslateWord[val]) {
      key = allTranslateWord[val];
    } else {
      allTranslateWord[val] = key;
    }

    // 用于防止中文转码为 unicode
    const v = Object.assign(t.stringLiteral(value), {
      extra: {
        raw: `\'${value}\'`,
        rawValue: value,
      },
    });
    return t.callExpression(
      t.identifier("$st"),
      setObjectExpression(variableObj)
        ? [t.stringLiteral(key), setObjectExpression(variableObj)]
        : ([t.stringLiteral(key)] as any)
    );
  }

  function setObjectExpression(obj?: { [key in string]: any }) {
    if (baseType(obj) === "[object Object]") {
      const ObjectPropertyArr = [];
      for (const o in obj) {
        ObjectPropertyArr.push(
          //@ts-ignore
          t.objectProperty(t.identifier(o), t.identifier(obj[o]))
        );
      }
      return t.objectExpression(ObjectPropertyArr);
    }
    return null;
  }

  const plugin = function () {
    return {
      visitor: {
        JSXText(path: NodePath<t.JSXText>) {
          const { node } = path;
          const value = node.value
            .trim()
            .replace(/(\n\s+)/g, "\n")
            .replace(/\s+\n/g, "\n");

          if (!value || value === "\n" || !isNaN(value as any)) {
            return;
          }
          path.replaceWith(
            t.jSXExpressionContainer(
              makeReplace({
                value,
              })
            )
          );
          path.skip();
        },
        JSXExpressionContainer(path: NodePath<t.JSXExpressionContainer>) {
          const { node } = path;
          if (
            path.parent.type === "JSXElement" &&
            node.expression.type === "StringLiteral"
          ) {
            path.replaceWith(
              t.jsxExpressionContainer(
                makeReplace({
                  value: node.expression.value,
                })
              )
            );
          }
        },

        StringLiteral(path: NodePath<t.StringLiteral>) {
          const { node } = path;
          const { value } = node;

          if (
            path.parent.type !== "JSXExpressionContainer" &&
            path.parentPath.parent.type === "JSXAttribute"
          ) {
            path.replaceWith(
              makeReplace({
                value: value.trim(),
              })
            );
          }
          //
          if (
            path.parent.type === "ConditionalExpression" &&
            path.parentPath.parent.type === "JSXExpressionContainer" &&
            path.parentPath.parentPath?.parentPath?.type === "JSXElement"
          ) {
            path.replaceWith(
              makeReplace({
                value: value.trim(),
              })
            );
          }
          path.skip();
        },
      },
    };
  };

  return plugin;
}

export default reactPlugin;
