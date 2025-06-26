# Toys Web

- [简介](#简介)<br />
- [安装](#安装)<br />
- [使用方法](#使用方法)<br />
- [API](#api)<br />
- [WebComponent](#webcomponent)<br />
- [Hooks](#hooks)<br />
    - [useComponentInstance](#usecomponentinstance)<br />
    - [useShadowRoot](#useshadowroot)<br />
    - [useProps](#useprops)<br />
    - [useState](#usestate)<br />
    - [useEffect](#useeffect)<br />
    - [useWatch](#usewatch)<br />
    - [useCreated](#usecreated)<br />
    - [useAdoptedCallback](#useadoptedcallback)<br />
    - [useConnectedCallback](#useconnectedcallback)<br />
    - [useDisconnectedCallback](#usedisconnectedcallback)<br />
- [Context](#context)<br />
    - [createContext](#createcontext)<br />
    - [useContext](#usecontext)<br />
- [简易 diff](#简易-diff)<br />
    - [diff](#diff)<br />
    - [useDynamicList](#usedynamiclist)<br />
- [原理](#原理)<br />
- [注意事项](#注意事项)<br />
- [参考项目](#参考项目)<br />


## 简介
一个可以让你使用 hooks 开发 Web Component 的玩具项目

## 安装

您可以通过 npm 安装

```bash
npm install toys-web
// vite typescript 项目可以额外安装 vite-toys-web-jsx 插件改善开发体验。
npm install vite-toys-web-jsx -D
```

在您的页面中添加 script

```html
<script src="node_modules/toys-web/lib/bundles/toys-web.umd.min.js"></script>
<script>
    const Modal = ToysWeb.WebComponent(function() {
        return `<div></div>`;
    });
    customElements.define('toys-modal', Modal);
</script>
或者
<script type="module">
    import { WebComponent } from 'node_modules/toys-web/lib/bundles/toys-web.es.min.js';
    const Modal = WebComponent(function() {
        return `<div></div>`;
    });
    customElements.define('toys-modal', Modal);
</script>
```

也可以在 [jsDelivr](http://www.jsdelivr.com/projects/toys-web) 中使用

```html
<script src="https://cdn.jsdelivr.net/npm/toys-web/lib/bundles/toys-web.umd.min.js"></script>
<script>
    const Modal = ToysWeb.WebComponent(function() {
        return `<div></div>`;
    });
    customElements.define('toys-modal', Modal);
</script>
或者
<script type="module">
    import { WebComponent } from 'https://cdn.jsdelivr.net/npm/toys-web/lib/bundles/toys-web.es.min.js';
    const Modal = WebComponent(function() {
        return `<div></div>`;
    });
    customElements.define('toys-modal', Modal);
</script>
```

## 使用方法

```ts
class ToysButton extends HTMLElement {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
            <style>
                button {
                    // ... your styles
                }
            </style>
            <button type="button">
                <span><slot></slot></span>
            </button>
        `;
    }

    private onClick() {
        this.dispatchEvent(new CustomEvent('onClick'));
    }

    connectedCallback() {
        const button = this.shadowRoot?.querySelector('button');
        button!.addEventListener('click', this.onClick);
    }

    disconnectedCallback() {
        const button = this.shadowRoot?.querySelector('button');
        button!.removeEventListener('click', this.onClick);
    }

    static get observedAttributes() {
        return ['htmlType'];
    }

    attributeChangedCallback(name: string, _: string, newValue: string) {
        const button = this.shadowRoot?.querySelector('button');
        if (name === 'htmlType') {
            button!.type = (newValue || 'button') as any;
        }
    }
}

customElements.define('toys-button', ToysButton);
```

上述代码是使用原生方法定义的一个关于按钮的自定义组件，在 `customElements.define` 执行完成后您可以在页面中直接使用

```html
<toys-button htmlType="button">
    这是一个按钮
</toys-button>
```

由于在 `observedAttributes` 中我们监听了 `htmlType` 属性的变化，因此在 `htmlType` 改变后会自动执行 `attributeChangedCallback` 内的方法。

而在引入 `toys-web` 后，组件的定义方式会发生一些变化

```ts
import { WebComponent, useShadowRoot, useConnectedCallback, useAttrs, useWatch, useComponentInstance } from 'toys-web';

const ToysButton = WebComponent(function () {
    const attrs = useAttrs({
        htmlType: String
    });

    const instance = useComponentInstance();
    const shadowRoot = useShadowRoot({ mode: 'open' });
    const button = shadowRoot?.querySelector('button');

    function onClick() {
        instance.dispatchEvent(new CustomEvent('onClick'));
    }

    useConnectedCallback(function () {
        button!.addEventListener('click', onClick);
        return () => {
            button!.removeEventListener('click', onClick);
        };
    });

    useWatch(function () {
        button!.type = (attrs.htmlType || 'button') as any;
    });

    return `
        <style>
            button {
                // ... your styles
            }
        </style>
        <button type="button">
            <span><slot></slot></span>
        </button>
    `;
});

customElements.define('toys-button', ToysButton);
```

在 Toys Web 中我们使用函数的 `return` 来返回自定义组件的模板，通过各个 hooks 来替代原生的方法。

- `useAttrs` 定义需要监听的属性
- `useProps` 定义需要绑定到组件的响应式属性
- `useComponentInstance` 获取原生的 `this`
- `useShadowRoot` 获取原生的 `this.shadowRoot`
- `useConnectedCallback` 获取原生的 `connectedCallback`，回调函数可以返回一个函数，返回的函数会在 `disconnectedCallback` 时执行
- `useWatch` 监听 `attrs`、`props` 和 `state` 的变化，当监听的属性发生变化时自动执行回调函数

## API

### WebComponent

用于定义自定义组件，传入的回调函数可以返回一个jsx函数、模板字符串。（推荐优先使用jsx函数）

```tsx
// jsx 函数
import { WebComponent } from 'toys-web';

const ToysButton = WebComponent(function () {
    function onClick() {
        console.log('toys！');
    }

    return () => (
        <button 
            type="button"
            onclick={onClick}
        >
            <span><slot></slot></span>
        </button>
    );
});

customElements.define('toys-button', ToysButton);
```

```ts
// 模板字符串
import { WebComponent, useShadowRoot } from 'toys-web';

const ToysButton = WebComponent(function () {
    const shadowRoot = useShadowRoot();

    useConnectedCallback(function () {
        const button = shadowRoot.querySelector('button')!;
        button.onclick = onClick;
    });

    function onClick() {
        console.log('toys！');
    }

    return `
        <button type="button">
            <span><slot></slot></span>
        </button>
    `;
});

customElements.define('toys-button', ToysButton);
```

可见相同功能下 jsx 函数的写法更加简洁。

### Hooks

#### useComponentInstance

获取当前组件的实例（`this`）

#### useShadowRoot

返回当前组件的 `shadowRoot`，等价于原生的 `attachShadow`。

```ts
const shadowRoot = useShadowRoot();
```

**参数**

`shadowRootInit`：一个 [ShadowRootInit](https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow#parameters) 字典

#### useAttrs

声明并获取需要监听的属性，这些属性会绑定到组件的 attributes 上。

```ts
const attrs = useAttrs({
    name: String,
    age: Number
});
```

**参数**
`attrsInit`：一个自定义格式化字典，key 为需要监听的属性，value 为该属性预期类型的构造函数，例如：如果要求一个属性的值是 `number` 类型，则可使用 `Number` 构造函数作为其声明的值

**注意**
attrs 是一个响应性对象，因此解构 `attrs` 会丢失响应性

#### useProps

声明并获取需要监听的属性.

```ts
const props = useProps({
    name: '张三',
    age: 18
});
```

**参数**
`propsInit`：一个自定义默认值字典，key 为需要绑定的属性，value 为默认值。

**注意**
props 是一个响应性对象，因此解构 `props` 会丢失响应性

#### useState

创建一个响应属性 `state`，`state` 的变化可以被 `useEffect`、`useWatch` 监听

```ts
const [count, setCount] = useState(0);
```

**参数**
任意值

**返回**
两个元素的数组：getter 和 setter

- 调用 getter（例如 count()）返回 `state` 的当前值。
- 调用 setter（例如 setCount(nextCount)）设置 signal 的值，

#### useEffect

监听 `state` 的变化

```ts
const [state, setState] = useState(0);

useWatch(function() {
    console.log('state', state());
});

setState(1);
// console 0
// console 1
```

#### useWatch

监听 `attrs`、`props` 和 `state` 的变化

```ts
const attrs = useAttrs({
    age: Number
});

const props = useProps({
    name: '张三'
});

const [state, setState] = useState(0);

useWatch(function() {
    console.log('age', attrs.age);
    console.log('namne', props.name);
    console.log('state', state());
});
```

#### useCreated

组件创建时（`constructor`）的回调

```ts
useCreated(function() {
    console.log('created !');
});
```

#### useAdoptedCallback

`adoptedCallback` 的回调

#### useConnectedCallback

`connectedCallback` 的回调，回调返回值为 `disconnectedCallback` 的回调

```ts
useConnectedCallback(function() {
    console.log('connedted !);
    return function() {
        console.log('dis connedted !);
    }
});
```

**参数**
`fn`：回调函数

**返回**
返回一个 `disconnectedCallback` 的回调函数（可选）

#### useDisconnectedCallback

`disconnectedCallback` 的回调

### Context

#### createContext

创建一个新的 `context` 对象，可以与 `useContext` 一起使用，并提供 `Provider` 控制流。当在层次结构的上方找不到 `Provider` 时，使用默认 `context`

```ts
import { WebComponent, createContext, useState } from 'toys-web';

export const CounterContext = createContext({
    count: () => 0,
    setCount: () => {}
});

const CounterProvider = WebComponent(function () {
    const [count, setCount] = useState(0);

    CounterContext.Provider({
        count,
        setCount
    });

    return `
        <div><slot></slot></div>
    `;
});

customElements.define('toys-counter-provider', CounterProvider);
```

#### useContext

用于获取 `context` 以允许深层传递 `props`，而不必通过每个组件层层传递

```ts
const context = useContext(CounterContext);

useWatch(function() {
    console.log(context().count());
});
```

## 原理

1. 当调用 `WebComponent` 时，立即执行回调函数，获取 `attrs` 的配置项、`shadowRoot` 的配置项、组件的模板字符串。
2. 当组件实例化时会再次执行回调函数，此时会根据步骤 1 中收集到的配置初始化组件，并在此时收集各个生命周期的回调函数
    - 若组件的返回值是模板字符串，则会在实例化时将其附加到 shadowRoot 上
    - 否则会在 connectedCallback 生命周期中附加到 shadowRoot 上
3. 在各个生命周期中执行相应的回调函数

## 注意事项

1. 由于 `WebComponent` 的回调函数会在组件真正实例化之前执行一次用以收集配置，此时 `useComponentInstance` 与 `useShadowRoot` 均会返回 **null**，因此在非生命周期中使用这两个对象时需格外注意。
同样在这次执行中也要收集组件模板，因此 **必须保证** 该回调能正确返回模板。
2. 由于问题 1 ，在处理相关数据时我们执行进行如下操作

```ts
const instance = useComponentInstance();
const shadowRoot = useShadowRoot();

useConnectedCallback(function() {
    const div = shadowRoot!.querySelector('div')!;
    div.className = 'your-classname';
    // ... Your other operations
});
```

3. `useEffect` 实际上也能够监听 `attrs` 和 `props` ，但同样因为问题 1 导致在该处执行监听时需格外注意 `instance` 与 `shadowRoot` 是否为 `null` ，徒增心智负担。
因此 Toys Web 提供了 `useWatch` ，该 hooks 的回调仅会在组件真正实例化后执行，无需关心 `instance` 与 `shadowRoot`

## 参考项目

[react](https://github.com/facebook/react)

[solidjs](https://github.com/solidjs/solid)