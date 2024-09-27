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

export type FunctionComponent = (this: HTMLElement & { props: Readonly<MapObject>; }) => string;

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

export interface DynamicListOptions<T = any> {
    /**
     * 挂载容器
     */
    el?: HTMLElement | null;
    /**
     * 更新节点
     * @param el 当前节点
     * @param record 数据
     * @param index 索引
     * @param data 列表
     */
    update?: (el: any, record: T, index: number, data: readonly T[]) => void;
    /**
     * 渲染函数
     * @param record 数据
     * @param index 索引
     * @param data 列表
     * @returns 创建节点
     */
    render: (record: T, index: number, data: readonly T[]) => HTMLElement;
}

export interface DiffOptions<T = any> extends DynamicListOptions<T> {
    /**
     * 挂载容器
     */
    el: HTMLElement;
    /**
     * 关联 list 数据
     */
    data: Accessor<T[]>;
}