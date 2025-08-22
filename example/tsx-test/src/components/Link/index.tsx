import { useAttrs, useComponentInstance, useShadowRoot, WebComponent } from 'toys-web';
import './style/index.less';

const Link = WebComponent(function () {
    const attrs = useAttrs({
        href: String,
        target: String,
        disabled: Boolean
    });

    const instance = useComponentInstance();
    useShadowRoot({ mode: 'open' });

    function onClick() {
        if (attrs.disabled) {
            return;
        }
        instance.dispatchEvent(new CustomEvent('onClick'));
        instance['onClick']?.();
    }

    function props() {
        const value: any = {};
        if (!!attrs.target) {
            value.target = attrs.target;
        }
        if (!!attrs.href) {
            value.href = attrs.href;
        }
        return value;
    }

    return () => (
        <a
            className={`link ${attrs.disabled ? 'disabled' : ''}`}
            onclick={onClick}
            {...props()}
        >
            <slot></slot>
        </a>
    );
});

export default Link;