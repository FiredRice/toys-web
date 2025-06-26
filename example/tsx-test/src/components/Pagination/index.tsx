import { useComponentInstance, useAttrs, useShadowRoot, useState, useWatch, WebComponent, Fragment } from 'toys-web';
import './style/index.less';

const Pagination = WebComponent(function () {
    const attrs = useAttrs({
        align: String,
        style: String,
        current: (v) => !!v ? Number(v) : 1,
        total: (v) => !!v ? Number(v) : 0,
        pageSize: (v) => !!v ? Number(v) : 10,
    });

    const instance = useComponentInstance();
    useShadowRoot({ mode: 'open' });

    let pageLength = 0;
    const [pageList, setPageList] = useState<(number | string)[]>([]);

    function onChange(page: number) {
        instance!.dispatchEvent(new CustomEvent('onChange', {
            detail: page
        }));
        instance['onChange']?.(page);
    }

    function onPrev() {
        if (attrs.current === 1) {
            return;
        }
        onChange(attrs.current - 1);
    }

    function onNext() {
        if (attrs.current === pageLength) {
            return;
        }
        onChange(attrs.current + 1);
    }

    function onPrev5() {
        onChange(Math.max(1, attrs.current - 5));
    }

    function onNext5() {
        onChange(Math.min(attrs.current + 5, pageLength));
    }

    useWatch(function () {
        const size = Math.ceil(attrs.total / attrs.pageSize);
        let list: (number | string)[] = [];
        if (size <= 6) {
            list = new Array(size).fill('').map((_, i) => i + 1);
        } else {
            let slice: number[] = [];
            const current = attrs.current;
            if (current <= 4) {
                slice = [1, 2, 3, 4, 5];
            } else if (current >= size - 3) {
                slice = new Array(5).fill('0').map((_, i) => size - (4 - i));
            } else {
                slice = [current - 2, current - 1, current, current + 1, current + 2];
            }
            if (current <= 4) {
                list = [...slice, 'next', size];
            } else if (current >= size - 3) {
                list = [1, 'prev', ...slice];
            } else {
                list = [1, 'prev', ...slice, 'next', size];
            }
        }
        if (!!attrs.total) {
            list.unshift('<');
            list.push('>');
        }
        setPageList(list);
        pageLength = size;
    });

    return () => (
        <Fragment>
            <style>
                {`:host {
                    justify-content: ${attrs.align || 'start'}
                }`}
            </style>
            <ul
                className='pagination'
                style={attrs.style || undefined}
            >
                {pageList().map(v => {
                    if (v === '<') {
                        return (
                            <li
                                key={v}
                                className={`pagination-prev ${attrs.current === 1 ? 'pagination-disabled' : ''}`}
                                title='上一页'
                                onclick={onPrev}
                                innerHTML={`<svg viewBox="64 64 896 896" focusable="false" data-icon="left" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path></svg>`}
                            />
                        );
                    }
                    if (v === '>') {
                        return (
                            <li
                                key={v}
                                className={`pagination-next ${attrs.current === pageLength ? 'pagination-disabled' : ''}`}
                                title='下一页'
                                onclick={onNext}
                                innerHTML={`<svg viewBox="64 64 896 896" focusable="false" data-icon="right" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z"></path></svg>`}
                            />
                        );
                    }
                    if (v === 'prev') {
                        return (
                            <li
                                key={v}
                                title='向前 5 页'
                                className='pagination-jump-prev'
                                onclick={onPrev5}
                            >
                                <span
                                    role='img'
                                    className='action'
                                    innerHTML={`<svg viewBox="64 64 896 896" focusable="false" data-icon="double-left" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M272.9 512l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L186.8 492.3a31.99 31.99 0 000 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H532c6.7 0 10.4-7.7 6.3-12.9L272.9 512zm304 0l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L490.8 492.3a31.99 31.99 0 000 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H836c6.7 0 10.4-7.7 6.3-12.9L576.9 512z"></path></svg>`}
                                ></span>
                                <span>•••</span>
                            </li>
                        );
                    }
                    if (v === 'next') {
                        return (
                            <li
                                key={v}
                                title='向后 5 页'
                                className='pagination-jump-next'
                                onclick={onNext5}
                            >
                                <span
                                    role='img'
                                    className='action'
                                    innerHTML={`<svg viewBox="64 64 896 896" focusable="false" data-icon="double-right" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M533.2 492.3L277.9 166.1c-3-3.9-7.7-6.1-12.6-6.1H188c-6.7 0-10.4 7.7-6.3 12.9L447.1 512 181.7 851.1A7.98 7.98 0 00188 864h77.3c4.9 0 9.6-2.3 12.6-6.1l255.3-326.1c9.1-11.7 9.1-27.9 0-39.5zm304 0L581.9 166.1c-3-3.9-7.7-6.1-12.6-6.1H492c-6.7 0-10.4 7.7-6.3 12.9L751.1 512 485.7 851.1A7.98 7.98 0 00492 864h77.3c4.9 0 9.6-2.3 12.6-6.1l255.3-326.1c9.1-11.7 9.1-27.9 0-39.5z"></path></svg>`}
                                ></span>
                                <span>•••</span>
                            </li>
                        );
                    }
                    return (
                        <li
                            key={v}
                            title={String(v)}
                            className={`pagination-item ${attrs.current === v ? 'pagination-item-active' : ''}`}
                            onclick={() => onChange(v as number)}
                        >
                            <a rel='nofollow'>
                                {v}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </Fragment>
    );
});

export default {
    tag: 'fr-pagination',
    component: Pagination
};