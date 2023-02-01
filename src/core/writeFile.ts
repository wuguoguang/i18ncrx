import * as vscode from "vscode";
import fs from "fs";
import * as t from "@babel/types";

import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generator from "@babel/generator";
import { prettierCode } from "./util";

export default async function writeFileWithKeys(
    path,
    allkeys: {
        [key in string]: string | number;
    }
) {
    if (!path) return;
    const hasFile = fs.existsSync(path);
    if (!hasFile) {
        vscode.window.showErrorMessage(path + "   don't exist");
        return;
    }
    let code: string | undefined = fs.readFileSync(path, "utf-8");
    code = await insertKeys(code, allkeys);
    fs.writeFileSync(path, code);
}

export async function insertKeys(
    code: string,
    allKeys: {
        [key in string]: string | number;
    }
) {
    const sourceAst = parse(code, {
        plugins: ["typescript", "jsx", "optionalChaining"],
        sourceType: "module",
    });

    traverse(sourceAst, {
        ObjectExpression(path) {
            const { node } = path;
            Object.entries(allKeys).forEach(([key, value]) => {
                node.properties.push(
                    t.objectProperty(
                        /\./.test(key) ? t.stringLiteral(key) : t.identifier(key),
                        //@ts-ignore
                        isNaN(value) ? t.stringLiteral(value) : t.nullLiteral(value)
                    )
                );
            });
        },
    });

    code = generator(sourceAst, {
        retainLines: true,
        decoratorsBeforeExport: true,
        jsescOption: {
            minimal: true,
        },
    }).code;

    console.log(code);

    return await prettierCode(code);
}
