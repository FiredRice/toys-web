import { useEffect, useState } from './hooks';
import { DiffOptions, DynamicListOptions } from './type';

export function diff<T>(options: DiffOptions<T>) {
    const { el, data, render, update } = options;

    let prevList = data();

    useEffect(function () {
        const curList = [...data()];
        const fragment = document.createDocumentFragment();
        if (!update) {
            // 没有更新方法直接全量创建
            el.innerHTML = '';
            for (let i = 0; i < curList.length; i++) {
                const record = curList[i];
                fragment.appendChild(render(record, i, curList));
            }
        } else {
            const childNodes = el.childNodes;
            const length = Math.max(prevList.length, curList.length);
            for (let i = 0; i < length; i++) {
                const record = curList[i];
                const node = childNodes[i];
                if (i < prevList.length && i < curList.length) {
                    update(node, record, i, curList);
                } else if (i < curList.length) {
                    fragment.appendChild(render(record, i, curList));
                } else if (node) {
                    node.remove();
                }
            }
        }
        prevList = curList;
        el.appendChild(fragment);
    });
}

export function useDynamicList<T>(value: T[], options?: DynamicListOptions<T>) {
    const { el, update, render } = options || {};

    const [list, setList] = useState<T[]>(value);

    function push(item: T) {
        const l = [...list()];
        l.push(item);
        if (el) {
            const node = render!(item, l.length - 1, l);
            el.appendChild(node);
        }
        setList(l);
    }

    function remove(index: number) {
        const l = [...list()];
        if (el) {
            const node = el.childNodes[index];
            node?.remove();
        }
        l.splice(index, 1);
        setList(l);
    }

    function replace(index: number, item: T) {
        const l = [...list()];
        l[index] = item;
        if (el) {
            const node = el.childNodes[index];
            if (update) {
                update(node, item, index, l);
            } else {
                const newNode = render!(item, index, l);
                el.replaceChild(node, newNode);
            }
        }
        setList(l);
    }

    function clear() {
        if (el) {
            el.innerHTML = '';
        }
        setList([]);
    }

    function pop() {
        const l = [...list()];
        l.pop();
        if (el) {
            const node = el.firstChild;
            if (node) {
                node.remove();
            }
        }
        setList(l);
    }

    function unshift(item: T) {
        const l = [...list()];
        l.unshift(item);
        if (el) {
            const node = render!(item, 0, l);
            el.insertBefore(node, el.firstChild);
        }
        setList(l);
    }

    function insert(index: number, item: T) {
        const l = [...list()];
        l.splice(index, 0, item);
        if (el) {
            const node = render!(item, 0, l);
            const oldNode = el.childNodes[index];
            el.insertBefore(node, oldNode);
        }
        setList(l);
    }

    function shift() {
        const l = [...list()];
        l.shift();
        if (el) {
            const node = el.firstChild;
            node?.remove();
        }
        setList(l);
    }

    function merge(index: number, items: T[]) {
        const l = [...list()];
        l.splice(index, 0, ...items);
        if (el) {
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < items.length; i++) {
                const record = items[i];
                const node = render!(record, index + i, l);
                fragment.appendChild(node);
            }
            const oldNode = el.childNodes[index];
            el.insertBefore(fragment, oldNode);
        }
        setList(l);
    }

    function move(oldIndex: number, newIndex: number) {
        const l = [...list()];
        const t = l[oldIndex];
        l.splice(oldIndex, 1);
        l.splice(newIndex, 0, t);
        if (el) {
            const oldNode = el.childNodes[oldIndex];
            const targetNode = el.childNodes[newIndex];
            const newNode = render!(t, newIndex, l);
            oldNode?.remove();
            el.insertBefore(newNode, targetNode);
        }
        setList(l);
    }

    function resetList(value: T[]) {
        if (el) {
            const prevLength = list().length;
            const curList = value;
            const fragment = document.createDocumentFragment();
            if (!update) {
                el.innerHTML = '';
                for (let i = 0; i < curList.length; i++) {
                    const record = curList[i];
                    fragment.appendChild(render!(record, i, curList));
                }
            } else {
                const childNodes = el.childNodes;
                const length = Math.max(prevLength, curList.length);
                for (let i = 0; i < length; i++) {
                    const record = curList[i];
                    const node = childNodes[i];
                    if (i < prevLength && i < curList.length) {
                        update(node, record, i, curList);
                    } else if (i < curList.length) {
                        fragment.appendChild(render!(record, i, curList));
                    } else if (node) {
                        node.remove();
                    }
                }
            }
            el.appendChild(fragment);
        }
        setList(value);
    }

    return {
        /**
         * 在列表末尾添加元素
         */
        push,
        /**
         * 移动元素
         */
        move,
        /**
         * 删除指定元素
         */
        remove,
        /**
         * 替换指定元素
         */
        replace,
        /**
         * 移除末尾元素
         */
        pop,
        /**
         * 在列表起始位置添加元素
         */
        unshift,
        /**
         * 移除起始位置元素
         */
        shift,
        /**
         * 在指定位置插入元素
         */
        insert,
        /**
         * 在指定位置插入多个元素
         */
        merge,
        /**
         * 重新设置 list 的值
         */
        resetList,
        /**
         * 清空 list
         */
        clear,
        /**
         * 获取当前 list 的值
         */
        value: list
    };
}