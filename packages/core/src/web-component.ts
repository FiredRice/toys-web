import { Accessor, Context, FunctionCall, MapFunction, ReturnTypeOfProperties } from './type';
import { MetaData, transPropString } from './common';
import { useEffect, useState } from './hooks';
import { jsx } from './jsx';

type Instance = HTMLElement | null;

const collector = new WeakMap<HTMLElement, MetaData>();

class WebComponentHooks {
    private handler: Instance = null;
    private shadowRootInit: ShadowRootInit = { mode: 'closed' };
    private attrs: MapFunction = {};

    public onAdoptedCallback: Function[] = [];
    public onConnectedCallback: (() => Function | void)[] = [];
    public onDisconnectedCallback: Function[] = [];

    public reset() {
        this.handler = null;
        this.shadowRootInit = { mode: 'closed' };
        this.attrs = {};
        this.onAdoptedCallback = [];
        this.onConnectedCallback = [];
        this.onDisconnectedCallback = [];
    }

    public setShadowRootInit(init: ShadowRootInit) {
        this.shadowRootInit = init;
    }

    public getShadowRootInit() {
        return this.shadowRootInit;
    }

    public setAttrs<P extends MapFunction>(props: P) {
        this.attrs = {
            ...this.attrs,
            ...props
        };
    }

    public getAttrs() {
        return this.attrs;
    }

    public setHandler(handler: Instance) {
        this.handler = handler;
    }

    public getHandler() {
        return this.handler;
    }
}

const globalHooks = new WebComponentHooks();

export function useComponentInstance() {
    return globalHooks.getHandler();
}

export function useShadowRoot(init: ShadowRootInit = { mode: 'closed' }): ShadowRoot | null {
    globalHooks.setShadowRootInit(init);
    const handler = globalHooks.getHandler();
    if (handler === null) {
        return null;
    }
    const meta = collector.get(handler);
    return meta?.shadowRoot || handler.shadowRoot;
}

export function useAttrs<Attrs extends MapFunction>(attrs: Attrs): Readonly<ReturnTypeOfProperties<Attrs>> {
    globalHooks.setAttrs(attrs);
    const handler = globalHooks.getHandler();
    if (handler === null) {
        return {} as any;
    }
    const meta = collector.get(handler);
    return (meta?.attrs || {}) as any;
}

export function useProps<T extends Record<string, any>>(props: T): T {
    const instance = useComponentInstance();
    if (!instance) {
        return { ...props };
    }
    const result: any = {};
    Object.entries(props).forEach(([k, v]) => {
        const [getter, setter] = useState(v);
        Object.defineProperty(instance, k, {
            get: getter,
            set: setter,
            enumerable: true
        });
        Object.defineProperty(result, k, {
            get: getter,
            set: setter,
            enumerable: true
        });
    });
    return result;
}

export function useWatch(callback: (this: HTMLElement) => (undefined | Function | void)) {
    const instance = useComponentInstance();
    if (!instance) return;
    useEffect(callback.bind(instance));
}

export function useCreated(callback: (this: HTMLElement) => void) {
    const instance = useComponentInstance();
    if (!instance) return;
    callback.call(instance);
}

export function useAdoptedCallback(fn: Function) {
    globalHooks.onAdoptedCallback.push(fn);
}

export function useConnectedCallback(fn: (() => Function | void)) {
    globalHooks.onConnectedCallback.push(fn);
}

export function useDisconnectedCallback(fn: Function) {
    globalHooks.onDisconnectedCallback.push(fn);
}

const contextMap = new WeakMap<symbol, {
    key: HTMLElement;
    value: any;
}[]>();

export function createContext<T>(defaultValue: T): Context<T> {
    const id = Symbol();

    function Provider(value?: T) {
        const instance = useComponentInstance();
        if (!instance) return;

        const list = contextMap.get(id) || [];
        list.push({
            key: instance,
            value: value ?? defaultValue
        });
        contextMap.set(id, list);

        useDisconnectedCallback(function () {
            let list = contextMap.get(id) || [];
            list = list.filter(i => i.key !== instance);
            if (!list.length) {
                contextMap.delete(id);
            } else {
                contextMap.set(id, list);
            }
        });
    }

    return {
        Provider,
        id,
        defaultValue
    };
}

export function useContext<T>(context: Context<T>): Accessor<T> {
    const instance = useComponentInstance();
    if (!instance) {
        return () => context.defaultValue;
    }

    const [value, setValue] = useState(context.defaultValue);

    useConnectedCallback(function () {
        const contextList = contextMap.get(context.id) || [];

        // 使用WeakMap替代Map以避免内存泄漏
        let parentMap: WeakMap<HTMLElement, any> | null = new WeakMap<HTMLElement, any>();

        // 优化遍历逻辑，直接使用WeakMap设置值
        for (const { key, value } of contextList) {
            parentMap.set(key, value);
        }

        function getContext(target: HTMLElement): T | undefined {
            let node = target.parentNode as HTMLElement;
            while (node !== null) {
                if (parentMap!.has(node)) {
                    return parentMap!.get(node) as T | undefined;
                }
                if (node.parentNode === null && !!node['host']) {
                    node = node['host'];
                    continue;
                }
                node = node.parentNode as HTMLElement;
            }
            return undefined;
        }

        setValue(getContext(instance) ?? context.defaultValue);
    });

    return value;
}

export function WebComponent(fn: FunctionCall): CustomElementConstructor {
    globalHooks.reset();

    let html: any = '';
    try {
        html = (fn as Function)();
    } catch (error) {
    }

    const shadowRootInit = globalHooks.getShadowRootInit();
    const attrs = globalHooks.getAttrs();

    return class extends HTMLElement {
        constructor() {
            super();
            try {
                const root = this.attachShadow(shadowRootInit);
                if (!!html && typeof html === 'string') {
                    root.innerHTML = html;
                }

                const meta = new MetaData();
                meta.shadowRoot = root;
                collector.set(this, meta);

                for (const key in attrs) {
                    const call = attrs[key];
                    const v = call(transPropString(this.getAttribute(key) || ''));
                    const [getter, setter] = useState(v);
                    Object.defineProperty(meta.attrs, key, {
                        get: getter,
                        set: setter,
                        enumerable: true
                    });
                    Object.defineProperty(this, key, {
                        get: getter,
                        set: function (v) {
                            this.setAttribute(key, `${v}`);
                            setter(v);
                        },
                        enumerable: true
                    });
                }

                globalHooks.reset();
                globalHooks.setHandler(this);

                const _html = fn.call(this as any);

                if (typeof _html === 'function') {
                    globalHooks.onConnectedCallback.unshift(() => {
                        useEffect(() => {
                            jsx.call(this, root, _html);
                        });
                    });
                }

                meta.lifeCycle = {
                    adoptedCallback: globalHooks.onAdoptedCallback,
                    connectedCallback: globalHooks.onConnectedCallback,
                    disconnectedCallback: globalHooks.onDisconnectedCallback
                };

                globalHooks.reset();
            } catch (error) {
                console.log(`Error loading template`, error);
            }
        }

        adoptedCallback() {
            const meta = collector.get(this);
            meta?.lifeCycle.adoptedCallback.forEach(c => c.call(this));
        }

        connectedCallback() {
            const meta = collector.get(this);
            meta?.lifeCycle.connectedCallback.forEach(c => {
                const canceler = c.call(this);
                if (typeof canceler === 'function') {
                    meta.lifeCycle.disconnectedCallback.push(canceler);
                }
            });
        }

        disconnectedCallback() {
            const meta = collector.get(this);
            meta?.lifeCycle.disconnectedCallback.forEach(c => c.call(this));
            collector.delete(this);
        }

        static get observedAttributes() {
            return Object.keys(attrs) || [];
        }

        attributeChangedCallback(name: string, _: string, newValue: string) {
            const value = attrs[name]?.(transPropString(newValue));
            if (collector.has(this)) {
                const meta = collector.get(this)!;
                meta.attrs[name] = value;
            }
        }
    };
}