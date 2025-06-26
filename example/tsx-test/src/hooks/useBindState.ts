import { useComponentInstance, useCreated, useState } from 'toys-web';
import { Accessor, Setter } from 'toys-web/lib/types/type';

export function useBindState<T>(key: string, value: T): [Accessor<T>, Setter<T>] {
    const instance = useComponentInstance();
    const [state, setState] = useState<T>(value);
    useCreated(function () {
        Object.defineProperty(instance, key, {
            get: state,
            set: setState,
            enumerable: true
        });
    });

    return [state, setState];
}