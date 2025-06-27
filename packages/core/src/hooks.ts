import { Accessor, Setter } from './type';

interface Effect {
    execute: Function;
    deps: Set<Subs>;
}

type Subs = Set<Effect>;

const effectStack: Effect[] = [];

/**
 * 发步订阅
 */
function subscribe(effect: Effect, subs: Subs) {
    subs.add(effect);
    effect.deps.add(subs);
}

/**
 * 清除订阅关系
 */
function cleanup(effect: Effect) {
    for (const subs of effect.deps) {
        subs.delete(effect);
    }
    effect.deps.clear();
}

export function useState<T = any>(value: T): [Accessor<T>, Setter<T>] {
    const subs: Subs = new Set();

    const getter = () => {
        const effect = effectStack[effectStack.length - 1];
        if (effect) {
            subscribe(effect, subs);
        }
        return value;
    };

    const setter = (nextValue: T) => {
        if (value === nextValue) return;
        value = nextValue;
        for (const effect of [...subs]) {
            effect.execute();
        }
    };

    return [getter, setter];
}

export function useEffect(callback: () => (undefined | Function | void)) {
    let prevFn;

    const effect: Effect = {
        execute,
        deps: new Set()
    };

    function execute() {
        cleanup(effect);
        effectStack.push(effect);
        try {
            if (prevFn && typeof prevFn === 'function') {
                prevFn();
            }
            prevFn = callback();
        } finally {
            effectStack.pop();
        }
    };

    execute();
}

export function useRef<T>(value?: T) {
    return {
        current: value
    };
}

export function useDeferredValue<T>(value: Accessor<T>): Accessor<T> {
	let v = value();
	let idleTimer: number | null = null;

	const [state, setState] = useState<T>(v);

	useEffect(() => {
		v = value();
		if (idleTimer !== null) {
			cancelIdleCallback(idleTimer);
			idleTimer = null;
		}
		idleTimer = requestIdleCallback((deadline) => {
			if (deadline.timeRemaining() > 0) {
				setState(v);
			}
			idleTimer = null;
		});
	});

	return state;
}