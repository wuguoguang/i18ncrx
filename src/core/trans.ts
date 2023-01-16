import   * as  prettier from 'prettier';
import  * as   babel from '@babel/core';
//@ts-ignore
import  pluginSyntaxJSX from '@babel/plugin-syntax-jsx';
//@ts-ignore
import  pluginSyntaxProposalOptionalChaining from '@babel/plugin-proposal-optional-chaining';
//@ts-ignore
import  pluginSyntaxClassProperties from '@babel/plugin-syntax-class-properties';
//@ts-ignore
import  pluginSyntaxDecorators from '@babel/plugin-syntax-decorators';
//@ts-ignore
import  pluginSyntaxObjectRestSpread from '@babel/plugin-syntax-object-rest-spread';
//@ts-ignore
import  pluginSyntaxAsyncGenerators from '@babel/plugin-syntax-async-generators';
//@ts-ignore
import  pluginSyntaxDoExpressions from '@babel/plugin-syntax-do-expressions';
//@ts-ignore
import  pluginSyntaxDynamicImport from '@babel/plugin-syntax-dynamic-import';
//@ts-ignore
import  pluginSyntaxFunctionBind from '@babel/plugin-syntax-function-bind';
//@ts-ignore
import  reactIntlToReactIntlUniversal from './plugin/reactIntlToReactIntlUniversal';

function transformFile(source: string,zhData:any) {
    let outObj = {
      hasReactIntlUniversal: false,
      needRewrite: false,
    };

    const transformOptions = {
      babelrc: false,
      plugins: [
        pluginSyntaxJSX,
        pluginSyntaxProposalOptionalChaining,
        pluginSyntaxClassProperties,
        [pluginSyntaxDecorators, { legacy: true }],
        pluginSyntaxObjectRestSpread,
        pluginSyntaxAsyncGenerators,
        pluginSyntaxDoExpressions,
        pluginSyntaxDynamicImport,
        pluginSyntaxFunctionBind,
        reactIntlToReactIntlUniversal(zhData, outObj),
      ],
      generatorOpts: {},
    };

    const bableObj = babel.transformSync(source, transformOptions);
}