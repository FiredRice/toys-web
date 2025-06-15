import { resolve } from 'path';
import { defineConfig } from 'vite';

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
    ]
});