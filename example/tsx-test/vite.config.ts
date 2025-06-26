import { defineConfig } from 'vite';
import toysWebPlugin from 'vite-toys-web-jsx';

export default defineConfig({
    build: {
        target: 'es6'
        // lib: {
        //     entry: 'src/main.tsx',
        //     name: 'MyLib',
        //     formats: ['es'],
        //     // the proper extensions will be added
        //     fileName: 'my-lib'
        // },
    }, 
    esbuild: {
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
        jsxImportSource: 'toys-web'
    },
    plugins: [
        toysWebPlugin({
            jsx: true
        }),
    ]
});