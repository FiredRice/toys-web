import { Accessor, Setter } from '../type';

const nodeMap = new Map<Function, {
	props: any;
	children: any[];
	states: [Accessor<any>, Setter<any>][];
}>;

let component: Function;
let root: Function;
let stateIndex = 0;

export function useState<T = any>(value: T): [Accessor<T>, Setter<T>] {
	const index = stateIndex;
	stateIndex += 1;
	const fn = component;
	const record = nodeMap.get(fn)!;
	if (!record || index < record.states.length) {
		return record.states[index];
	}

	let v = value;

	function getter() {
		return v;
	}

	function setter(value: T) {
		v = value;
		window['update'](root);
	}

	record.states[index] = [getter, setter];

	nodeMap.set(fn, record);

	return [getter, setter];
}

function h(tag: string | Function, props: any, ...children: any[]) {
	if (typeof tag === 'function') {
		if (!nodeMap.has(tag)) {
			nodeMap.set(tag, {
				props,
				children,
				states: []
			});
		}
		component = tag;
		stateIndex = 0;
		return tag(props, ...children);
	}
	const node = document.createElement(tag);

	for (const key in props) {
		node[key] = props[key];
	}

	const fragment = document.createDocumentFragment();

	for (const child of children) {
		if (child === false || child == null) {
			continue;
		}
		if (Array.isArray(child)) {
			child.forEach(c => {
				fragment.appendChild(c);
			});
			continue;
		}
		if (child instanceof Element) {
			fragment.appendChild(child);
			continue;
		}

		const text = document.createTextNode(child);
		fragment.appendChild(text);
	}

	node.appendChild(fragment);

	return node;
}

window['h'] = h;

let rootDom: Element;

window['update'] = function (jsx: Function) {
	rootDom.innerHTML = '';
	component = jsx;
	rootDom.appendChild(h(jsx, {}));
};
window['render'] = function (container: Element, jsx: Function) {
	rootDom = container;
	root = jsx;
	component = jsx;
	rootDom.appendChild(h(jsx, {}));
};