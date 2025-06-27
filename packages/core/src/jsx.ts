const FRAGMENT = Symbol('toys_fragment');
const ARRAY = Symbol('toys_array');
const TEXT = Symbol('toys_text');
const NONE = Symbol('toys_none');

class Fiber {
    public tag: string | symbol = '';
    public props: Record<string | number, any> = {};
    public children: Fiber[] = [];
    public node?: HTMLElement | Text;
    public value?: any;
}

const FIBER = Symbol();

export function jsx(shadowRoot: ShadowRoot, fn: Function) {
    const fiberTree: Fiber = fn();
    if (!Reflect.has(this, FIBER)) {
        const rootNode = createTree(fiberTree);
        shadowRoot.appendChild(rootNode);
    } else {
        const prevTree = this[FIBER];
        updateTree(prevTree, fiberTree);
    }
    this[FIBER] = fiberTree;
}

function setProps(node: HTMLElement, props: any) {
    for (const key in props) {
        if (key === 'key') {
            continue;
        }
        if (key === 'style') {
            if (!props[key]) {
                node.removeAttribute('style');
            } else if (typeof props[key] === 'string') {
                node.setAttribute('style', props[key]);
            } else {
                Object.entries(props[key]).forEach(([k, v]) => {
                    node.style.setProperty(k, String(v));
                });
            }
            continue;
        }
        if (key === 'ref') {
            if (Reflect.has(props[key], 'current')) {
                props[key].current = node;
            }
            continue;
        }
        node[key] = props[key];
    }
}

function updateProps(pre: Fiber, cur: Fiber) {
    const preProps = { ...pre.props };
    const curProps = cur.props;
    const node = cur.node! as HTMLElement;

    for (const key in curProps) {
        if (key === 'ref') {
            if (Reflect.has(curProps.ref, 'current')) {
                curProps.ref.current = node;
            }
        } else if (key === 'key') {
        } else if (key === 'style') {
            if (!curProps[key]) {
                node.removeAttribute('style');
            } else if (typeof curProps[key] === 'string') {
                if (preProps[key] !== curProps[key]) {
                    node.setAttribute('style', curProps[key]);
                }
            } else {
                const preStyles = { ...preProps[key] };
                const curStyles = curProps[key];
                Object.entries(curStyles).forEach(([k, v]) => {
                    node.style.setProperty(k, String(v));
                    Reflect.deleteProperty(preStyles, k);
                });
                Object.keys(preStyles).forEach(k => {
                    node.style.removeProperty(k);
                });
            }
        } else {
            if (preProps[key] !== curProps[key]) {
                node[key] = curProps[key];
            }
        }
        if (Reflect.has(preProps, key)) {
            Reflect.deleteProperty(preProps, key);
        }
    }
    for (const key in preProps) {
        node[key] = undefined;
    }
}

function createTree(node: Fiber) {
    const { tag, props, children = [], value } = node;
    let realNode;
    if (tag === FRAGMENT) {
        realNode = document.createDocumentFragment();
    } else if (tag === NONE) {
        realNode = document.createTextNode('');
    } else if (tag === TEXT) {
        realNode = document.createTextNode(value);
    } else if (tag === ARRAY) {
        realNode = document.createDocumentFragment();
    } else {
        realNode = document.createElement(tag as string);
        setProps(realNode, props);
    }
    if (tag !== FRAGMENT && tag !== ARRAY) {
        node.node = realNode;
    }
    if (children.length) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const n = createTree(child);
            realNode.appendChild(n);
        }
    }
    return realNode;
}

function replaceNode(pre: Fiber, cur: Fiber) {
    const n = createTree(cur);
    if (pre.tag === ARRAY) {
        pre.children.forEach((c, i) => {
            if (i === 0) {
                // (c.node as HTMLElement).parentNode?.replaceChild(n, c.node);
                c.node!.replaceWith(n);
            } else {
                c.node!.remove();
            }
        });
    } else {
        // (pre.node as HTMLElement).parentNode?.replaceChild(n, pre.node);
        pre.node!.replaceWith(n);
    }
}

function diffFiber(pre: Fiber[], cur: Fiber[]) {
    let i = 0;
    for (i; i < cur.length; i++) {
        const newFiber = cur[i];
        const oldFiber = pre[i];
        if (
            !oldFiber
            || oldFiber.tag !== newFiber.tag
            || oldFiber.props.key !== newFiber.props.key
        ) {
            break;
        }
        updateTree(oldFiber, newFiber);
    }

    // 全部遍历完
    if (i >= cur.length && i >= pre.length) {
        return;
    }

    // 新旧都没遍历完
    if (i < pre.length && i < cur.length) {
        const oldMap = new Map<string, number>();
        for (let j = i; j < pre.length; j++) {
            oldMap.set(pre[j].props.key, j);
        }
        let maxIndex = i;
        for (let j = i; j < cur.length; j++) {
            const newFiber = cur[j];
            const curKey = newFiber.props.key;
            if (oldMap.has(curKey)) {
                const oldIndex = oldMap.get(curKey)!;
                oldMap.delete(curKey);
                const oldFiber = pre[oldIndex];
                updateTree(oldFiber, newFiber);
                if (maxIndex > oldIndex) {
                    cur[j - 1].node!.after(newFiber.node!);
                } else {
                    maxIndex = oldIndex;
                }
            } else {
                const n = createTree(newFiber);
                if (j === 0) {
                    pre[0].node!.before(n);
                } else {
                    cur[j - 1].node!.after(n);
                }
            }
        }
        oldMap.forEach((index) => {
            pre[index].node!.remove();
        });
        return;
    }

    // 旧树遍历完，新树没遍历完
    if (i >= pre.length && i < cur.length) {
        const fragment = document.createDocumentFragment();
        for (let j = i; j < cur.length; j++) {
            const n = createTree(cur[j]);
            fragment.appendChild(n);
        }
        cur[i - 1].node!.after(fragment);
        return;
    }

    // 新树遍历完，旧树没遍历完
    if (i >= cur.length && i < pre.length) {
        for (let j = i; j < pre.length; j++) {
            pre[j].node!.remove();
        }
    }
}

function updateTree(pre: Fiber, cur: Fiber) {
    cur.node = pre.node;
    if (pre.tag === NONE) {
        return;
    }
    if (pre.tag === TEXT) {
        if (pre.value !== cur.value) {
            (cur.node as Text).textContent = cur.value;
        }
        return;
    }
    if (pre.tag === ARRAY) {
        diffFiber(pre.children, cur.children);
        return;
    }
    if (pre.tag !== FRAGMENT) {
        updateProps(pre, cur);
    }
    const preChildren = pre.children;
    const curChildren = cur.children;
    let i = 0;
    const length = Math.min(preChildren.length, curChildren.length);
    for (i; i < length; i++) {
        const preChild = preChildren[i];
        const curChild = curChildren[i];
        if (preChild.tag === curChild.tag) {
            updateTree(preChild, curChild);
        } else {
            replaceNode(preChild, curChild);
        }
    }
    if (preChildren.length <= curChildren.length) {
        if (i === curChildren.length) {
            return;
        }
        const fragment = document.createDocumentFragment();
        for (i; i < curChildren.length; i++) {
            const curChild = curChildren[i];
            const n = createTree(curChild);
            fragment.appendChild(n);
        }
        cur.node!.appendChild(fragment);
    } else {
        for (i; i < preChildren.length; i++) {
            const preChid = preChildren[i];
            preChid.node!.remove();
        }
    }
}

export function h(tag: symbol | string | Function, props: any, ...children: any[]) {

    if (typeof tag === 'function') {
        return tag(props, ...children);
    }

    const vnode = new Fiber();
    vnode.tag = tag;
    vnode.props = props || {};

    if (!children.length) {
        return vnode;
    }

    for (let i = 0; i < children.length; i++) {
        const fiber = new Fiber();
        const child = children[i];
        if (child === false || child == null) {
            fiber.tag = NONE;
            vnode.children.push(fiber);
            continue;
        }
        if (Array.isArray(child)) {
            if (!child.length) {
                fiber.tag = NONE;
            } else {
                const children: Fiber[] = [];
                for (const c of child as Fiber[]) {
                    if (c.tag === FRAGMENT) {
                        if (!c.children?.length) {
                            c.tag = NONE;
                            children.push(c);
                        } else {
                            children.push(...c.children!);
                        }
                    } else {
                        children.push(c);
                    }
                }
                fiber.tag = ARRAY;
                fiber.children = children;
            }
            vnode.children.push(fiber);
            continue;
        }
        if (child instanceof Fiber) {
            if (child.tag === FRAGMENT) {
                if (child.children.length) {
                    for (const c of child.children) {
                        vnode.children.push(c);
                    }
                } else {
                    child.tag = NONE;
                }
            } else {
                vnode.children.push(child);
            }
            continue;
        }

        fiber.tag = TEXT;
        fiber.value = child;
        vnode.children.push(fiber);
    }

    return vnode;
}

export function Fragment(props: any, ...children: any[]) {
    return h(FRAGMENT, props, ...children);
}