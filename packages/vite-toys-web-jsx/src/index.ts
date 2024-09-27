import path from 'path';
import fs from 'fs';
import less from 'less';
import csso from 'csso';

class CodeTransform {
    private code = '';
    private id = '';

    constructor(code: string, id: string) {
        this.code = code;
        this.id = id;
    }

    private async extractStyle() {
        const cssRegex = /import\s+['"].*\.(le|c)ss['"](;?)/g;
        const matchRegex = /['"](.*?)['"](;?)/;
        const cssImports: string[] = [];

        this.code = this.code.replace(cssRegex, (match) => {
            const m = matchRegex.exec(match);
            if (m !== null) {
                cssImports.push(m[1]);
            }
            return '';
        });

        let cssCode = '';
        for (const cssRequest of cssImports) {
            const cssPath = path.resolve(path.dirname(this.id), cssRequest);
            let code = fs.readFileSync(cssPath, 'utf-8');
            if (cssPath.endsWith('.less')) {
                const parse = await less.render(code);
                code = parse.css;
            }
            code = csso.minify(code).css;
            cssCode += code;
        }

        return !!cssCode ? `<style>${cssCode}</style>` : '';
    }

    public async run() {
        const style = await this.extractStyle();
        const jsxRegex = /return\s+\(?\s*<(.*?)>\s*\)?;?\s*}/gs;
        this.code = this.code.replace(jsxRegex, (match, jsx) => {
            jsx = `<${jsx}>`;
            jsx = jsx.replace('<>', '');
            jsx = jsx.replace('</>', '');
            return `return \`${style}${jsx}\`;}`;
        });
        return this.code;
    }
}

export default function toysWebPlugin(): any {
    return {
        name: 'toys-web-jsx',
        // 应用插件的入口点
        enforce: 'pre',
        // 转换源代码
        async transform(code, id, options) {
            if (!id.endsWith('.tsx')) {
                return;
            }

            const parser = new CodeTransform(code, id);

            const result = await parser.run();

            return {
                code: result,
                map: null
            };
        },
    };
}
