import { Accessor, InternalHooks, Keyof, MapObject, StoreContextInstance, StoreContextProvicerProps, StoreContextRealInstance, WatchCallBack } from './type';
import { useState } from './hooks';
import { useConnectedCallback, createContext, useContext as useBaseContext } from './web-component';

const HOOK_MARK = Symbol();

class ContextService<T extends MapObject> implements StoreContextRealInstance<T> {
    private innerValue: T;
    private watchList: WatchCallBack<T>[] = [];

    constructor(value: T) {
        this.innerValue = value;
    }
    public getValues() {
        return this.innerValue;
    }
    public setValues(values: Partial<T>) {
        this.innerValue = Object.assign({}, this.innerValue, values);
        this.notifyWatch();
    }

    private registerWatch: InternalHooks<T>['registerWatch'] = callback => {
        this.watchList.push(callback);

        return () => {
            this.watchList = this.watchList.filter(fn => fn !== callback);
        };
    };

    private notifyWatch = () => {
        if (this.watchList.length) {
            const values = this.getValues();
            this.watchList.forEach(callback => {
                callback(values);
            });
        }
    };

    public getInternalHooks = (key: symbol): InternalHooks<T> | null => {
        if (key === HOOK_MARK) {
            return {
                registerWatch: this.registerWatch,
            };
        }
        return null;
    };
}

export function useStoreContext<T extends MapObject>(defaultValues: T, instance?: StoreContextInstance<T>) {
    let storeInstance: StoreContextInstance<T> | undefined = undefined;

    if (!storeInstance) {
        if (instance) {
            storeInstance = instance;
        } else {
            const refInstanceStore = new ContextService(defaultValues);
            storeInstance = refInstanceStore;
        }
    }
    return [storeInstance];
}

export function createStoreContext<T extends MapObject>(defaultValue: T) {
    const InternalContext = createContext<StoreContextInstance<T>>(new ContextService(defaultValue));

    function Provider(props: StoreContextProvicerProps<T> = {}) {
        const { value, context } = props;

        const [instance] = useStoreContext(value ?? defaultValue, context);

        InternalContext.Provider(instance);
    }

    function useContext(): Accessor<StoreContextInstance<T>> {
        return useBaseContext(InternalContext);
    }

    function useStoreWatch(key?: undefined): Accessor<T>;
    function useStoreWatch<K extends Keyof<T>>(key: K): Accessor<T[K]>;
    function useStoreWatch(key: any): Accessor<T> {
        const [value, setValue] = useState(key === undefined ? defaultValue : defaultValue?.[key]);

        const refInstance = useContext() as Accessor<StoreContextRealInstance<T>>;

        useConnectedCallback(function () {
            const registerWatch = refInstance().getInternalHooks(HOOK_MARK)!.registerWatch;

            function update() {
                const values = refInstance().getValues();
                const newValue = key === undefined ? values : values?.[key];
                setValue(newValue);
            }

            const cancelRegister = registerWatch(update);

            update();

            return cancelRegister;
        });

        return value;
    };

    return {
        Provider,
        useContext,
        useStoreWatch
    };
}