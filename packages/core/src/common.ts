export function transPropString(value: string) {
    switch (value) {
        case 'null':
            return null;
        case 'undefined':
            return undefined;
        case 'NaN':
            return NaN;
        case 'false':
            return false;
        case 'true':
            return true;
        default:
            return value || '';
    }
}

export class MetaData {
    public props: any = {};
    public shadowRoot: ShadowRoot | null = null;
    public lifeCycle = {
        adoptedCallback: [] as Function[],
        connectedCallback: [] as (() => Function | void)[],
        disconnectedCallback: [] as Function[]
    };
}