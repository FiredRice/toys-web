import path from 'path';
import fs from 'fs';
import less from 'less';
import { minify as cssoMinify } from 'csso';
import { minify as htmlMinify } from 'html-minifier';
import { Project, SourceFile, SyntaxKind } from 'ts-morph';

async function transWebComponentJSX(sourceFile: SourceFile, options?: Options) {
    const { jsx = false } = options || {};
    const filePath = sourceFile.getFilePath();
    const dir = path.dirname(filePath);
    const imports = sourceFile?.getImportDeclarations();

    let isComponent = false;
    let hasFragment = false;
    let hasH = false;

    for (const imp of imports) {
        const importPath = imp.getModuleSpecifierValue();
        if (importPath === 'toys-web') {
            const elements = imp.getNamedImports();
            for (const e of elements) {
                if (e.getName() === 'WebComponent') {
                    isComponent = true;
                }
                if (e.getName() === 'Fragment') {
                    hasFragment = true;
                }
                if (e.getName() === 'h') {
                    hasH = true;
                }
            }
        }
    }

    // 提取样式路径
    const styles = new Set<string>();

    if (isComponent) {
        for (const imp of imports) {
            const importPath = imp.getModuleSpecifierValue();
            if (/\.(le|c)ss$/.test(importPath)) {
                styles.add(path.join(dir, importPath));
                imp.remove();
            }
        }
    }

    if (jsx) {
        const helpImports: string[] = [];
        if (!hasFragment) {
            helpImports.push('Fragment');
        }
        if (!hasH) {
            helpImports.push('h');
        }
        sourceFile.addImportDeclaration({
            moduleSpecifier: 'toys-web',
            namedImports: helpImports
        });
    }

    const styleCode = await readStyles(styles);
    if (jsx) {
        await injectStyle2JSX(sourceFile, styleCode);
    } else {
        await transJSX2String(sourceFile, styleCode, options?.minify || {});
    }
}

/**
 * 向 jsx 中注入 style 代码
 */
async function injectStyle2JSX(sourceFile: SourceFile, styleCode: string) {
    if (!styleCode) {
        return;
    }
    const filePath = sourceFile.getFilePath();

    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    const webComponentCalls = callExpressions.filter(call => call.getExpression().getText() === 'WebComponent');

    if (!webComponentCalls.length || !webComponentCalls[0].getArguments().length) {
        return;
    }
    const fun = webComponentCalls[0].getArguments()[0];
    if (!fun.isKind(SyntaxKind.FunctionExpression) && !fun.isKind(SyntaxKind.ArrowFunction)) {
        console.warn('Error: ', filePath);
        console.warn('Line: ', fun.getStartLineNumber());
        console.warn('Info: The parameters of WebComponent must be a function');
        return;
    }
    let returnNode;
    try {
        returnNode = fun.getStatementByKind(SyntaxKind.ReturnStatement);
    } catch (error) {
        // 特例： () => () => JsxElement
        returnNode = fun;
    }
    if (!returnNode) {
        return;
    }
    let jsxNode;
    const arrowCall = returnNode.getChildrenOfKind(SyntaxKind.ArrowFunction)[0];
    if (arrowCall) {
        // 返回值为箭头函数
        // 有括号
        jsxNode = arrowCall.getChildrenOfKind(SyntaxKind.ParenthesizedExpression)[0]?.getChildrenOfKind(SyntaxKind.JsxElement)[0];
        if (!jsxNode) {
            jsxNode = arrowCall?.getChildrenOfKind(SyntaxKind.JsxElement)[0];
        }
    } else {
        // 返回值是普通函数
        const funCallReturn = returnNode.getChildrenOfKind(SyntaxKind.FunctionExpression)[0]?.getChildrenOfKind(SyntaxKind.Block)[0]?.getChildrenOfKind(SyntaxKind.ReturnStatement)[0];
        // 有括号
        jsxNode = funCallReturn?.getChildrenOfKind(SyntaxKind.ParenthesizedExpression)[0]?.getChildrenOfKind(SyntaxKind.JsxElement)[0];
        if (!jsxNode) {
            jsxNode = funCallReturn?.getChildrenOfKind(SyntaxKind.JsxElement)[0];
        }
    }
    if (!jsxNode) {
        console.warn('Error: ', filePath);
        console.warn('Line: ', returnNode.getStartLineNumber());
        console.warn('Info: The return value of the WebComponent parameter must be the JsxElement function');
        return;
    }
    const oldCode = jsxNode!.getText();
    const newCode = `<Fragment><style>{\`${styleCode}\`}</style>${oldCode}</Fragment>`;
    jsxNode?.replaceWithText(newCode);
}

/**
 * 将 jsx 转换成字符串
 * @param sourceFile 
 * @param styleCode 
 * @param minify html 压缩配置
 */
async function transJSX2String(sourceFile: SourceFile, styleCode: string, minify: any) {
    const filePath = sourceFile.getFilePath();

    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    const webComponentCalls = callExpressions.filter(call => call.getExpression().getText() === 'WebComponent');
    if (!webComponentCalls.length || !webComponentCalls[0].getArguments().length) {
        return;
    }
    const fun = webComponentCalls[0].getArguments()[0];
    if (!fun.isKind(SyntaxKind.FunctionExpression) && !fun.isKind(SyntaxKind.ArrowFunction)) {
        console.warn('Error: ', filePath);
        console.warn('Line: ', fun.getStartLineNumber());
        console.warn('Info: The parameters of WebComponent must be a function');
        return;
    }
    let returnNode = fun.getStatementByKind(SyntaxKind.ReturnStatement);
    if (!returnNode) {
        returnNode = fun.getBody() as any;
    }
    if (!returnNode) {
        return;
    }

    let jsxNode = returnNode.getChildrenOfKind(SyntaxKind.ParenthesizedExpression)[0]?.getExpressionIfKind(SyntaxKind.JsxElement);
    if (!jsxNode) {
        jsxNode = returnNode.getExpressionIfKind(SyntaxKind.JsxElement);
    }
    if (!jsxNode) {
        return;
    }
    let code = jsxNode!.getText();
    code = code.replace('<>', '');
    code = code.replace('</>', '');
    code = code.replace('<Fragment>', '');
    code = code.replace('</Fragment>', '');
    const minifyConfig = {
        collapseWhitespace: true,
        ...minify,
    };
    code = htmlMinify(code, minifyConfig);
    if (!!styleCode) {
        code = `<style>${styleCode}</style>${code}`;
    }
    code = `\`${code}\``;
    jsxNode?.replaceWithText(code);
}

async function readStyles(styles: Set<string>) {
    let cssCode = '';
    for (const cssPath of styles) {
        let code = fs.readFileSync(cssPath, 'utf-8');
        if (cssPath.endsWith('.less')) {
            const parse = await less.render(code);
            code = parse.css;
        }
        if (process.env.NODE_ENV === 'production') {
            code = cssoMinify(code).css;
        }
        cssCode += code;
    }
    return cssCode;
}

type Options = {
    minify?: any;
    jsx?: boolean;
};

export default function testPlugin(options?: Options): any {
    return {
        name: 'toys-web-jsx',
        // 应用插件的入口点
        enforce: 'pre',
        // 转换源代码
        async transform(code, id) {
            if (!id.endsWith('.tsx')) {
                return;
            }
            const project = new Project();
            project.addSourceFileAtPath(id);
            const sourceFile = project.getSourceFile(id);
            if (!sourceFile) {
                return {
                    code,
                    map: null
                };
            }

            await transWebComponentJSX(sourceFile, options);

            return {
                code: sourceFile.getText(),
                map: null
            };
        },
    };
}
