# vite-toys-web-jsx

## 简介

在 vite 项目中使用 jsx 开发 toys-web 组件的简易插件。

## 安装

```sh
npm install vite-toys-web-jsx -D
```

## 使用方法

tsconfig.json 文件的 `compilerOptions` 进行如下配置

```json
"compilerOptions": {
    "jsx": "preserve",
}
```

vite.config.ts 文件中进行如下配置

```ts
import { defineConfig } from 'vite';
import toysWebJsx from 'vite-toys-web-jsx';

export default defineConfig({
    plugins: [
        toysWebJsx({
            minify: {
                removeComments: true
            }
        })
    ]
});
```

**注意：** 插件使用 `html-minifier` 压缩 html 代码，配置属性可通过 `minify` 传入。

## 功能介绍

完成插件配置后在编写 toys-web 组件时不必再返回字符串，而是可以返回 jsx。

组件导入的 less 或 css 文件会将样式代码压缩后作为 `<style>` 标签插入组件。

例如：

```css
// style.css
.box{
    color:#1677ff;
}
```

```ts
// box.tsx
import { WebComponent, useShadowRoot, useConnectedCallback, useProps, useWatch, useComponentInstance } from 'toys-web';
import './style.css';

const Box = WebComponent(function () {
    return (
        <div class="box">
            <slot></slot>
        </div>
    );
});

customElements.define('toys-box', Box);
```

上述组件在经过插件编译后会变成如下代码：

```js
import { WebComponent, useShadowRoot, useConnectedCallback, useProps, useWatch, useComponentInstance } from 'toys-web';

const Box = WebComponent(function () {
    return `<style>.box{color:#1677ff;}</style><div><slot></slot></div>`;
});

customElements.define('toys-box', Box);
```
