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
        const effect = effectStack.at(-1);
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

    const execute = () => {
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

    const effect: Effect = {
        execute,
        deps: new Set()
    };

    execute();
}