export type Accessor<T> = () => T;
export type Setter<T> = (value: T) => void;

export interface Context<T> {
    Provider: (value?: T) => void;
    id: symbol;
    defaultValue: T;
};

export type FunctionType<T> = T extends (...args: any[]) => infer R ? R : never;

export type ReturnTypeOfProperties<T> = {
    [K in keyof T]: FunctionType<T[K]>;
};

export type MapFunction = Record<string, Function>;
export type MapObject = Record<string, any>;

export type FunctionCall = (this: HTMLElement) => any;

export type Keyof<T extends MapObject> = keyof T | '';

export interface StoreContextRealInstance<T extends MapObject> {
    getValues: () => T;
    setValues: (values: Partial<T>) => void;
    getInternalHooks: (key: symbol) => InternalHooks<T> | null;
}

export type StoreContextInstance<T extends MapObject> = Omit<StoreContextRealInstance<T>, 'getInternalHooks'>;

export type WatchCallBack<T extends MapObject> = (values: T) => void;

export interface InternalHooks<T extends MapObject> {
    registerWatch: (callback: WatchCallBack<T>) => () => void;
}

export interface StoreContextProvicerProps<T extends MapObject> {
    value?: T;
    context?: StoreContextInstance<T>;
}