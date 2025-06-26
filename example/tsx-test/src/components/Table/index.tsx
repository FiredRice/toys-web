import { useConnectedCallback, useAttrs, useRef, useShadowRoot, useState, useWatch, WebComponent, useProps } from 'toys-web';
import './style/index.less';

const Table = WebComponent(function () {
    const attrs = useAttrs({
        height: Number,
        rowKey: String,
    });

    useShadowRoot({ mode: 'open' });

    const container = useRef<HTMLDivElement>();

    const [containerClass, setContainerClass] = useState<string[]>(['table']);
    const [dataSlice, setDataSlice] = useState<any[]>([]);

    const props = useProps({
        dataSource: [] as any[],
        columns: [] as any[],
        pagination: undefined as any
    });

    useConnectedCallback(function () {
        container.current.addEventListener('scroll', updateScrollClass);

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.target === container.current) {
                    updateScrollClass();
                }
            }
        });

        observer.observe(container.current);

        return () => {
            container.current!.removeEventListener('scroll', updateScrollClass);
            observer.unobserve(container.current!);
        };
    });

    useWatch(function () {
        const list = props.dataSource.slice();

        if (!props.pagination) {
            setDataSlice(list);
            return;
        }

        const { current, pageSize = 10 } = props.pagination;

        const startIndex = (current - 1) * pageSize;
        const slice: any[] = [];

        for (let i = startIndex; i < startIndex + 10; i++) {
            if (i >= list.length) {
                break;
            }
            slice.push(list[i]);
        }

        setDataSlice(slice);
    });

    function updateScrollClass() {
        // 检查是否有多余的横向滚动条
        const { scrollWidth, clientWidth, scrollLeft } = container.current;
        const classList = ['table'];
        if (scrollWidth > clientWidth) {
            // 左侧检测：当滚动条不在最左侧时添加ping-left，否则移除
            if (scrollLeft > 0) {
                classList.push('table-ping-left');
            }

            if (scrollLeft < scrollWidth - clientWidth) {
                classList.push('table-ping-right');
            }
        }
        setContainerClass(classList);
    }

    function colProps(col) {
        const { align = 'left', fixed } = col;
        const props: any = {};
        if (align !== 'left') {
            props.style = { 'text-align': 'center' };
        }
        if (fixed === 'left') {
            props.className = 'table-cell-fix-left';
        } else if (fixed === 'right') {
            props.className = 'table-cell-fix-right';
        }
        return props;
    }

    return () => (
        <div>
            <div
                ref={container}
                className={containerClass().join(' ')}
                style={!!attrs.height ? `height: ${attrs.height}px;` : undefined}
            >
                <table>
                    <thead>
                        <tr>
                            {props.columns.map(c => (
                                <th
                                    key={c.key ?? c.dataIndex}
                                    scope='col'
                                    {...colProps(c)}
                                >
                                    {c.title || ''}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {dataSlice().map((d, i) => (
                            <tr key={d[attrs.rowKey]}>
                                {props.columns.map((col) => (
                                    <td
                                        key={col.key ?? col.dataIndex}
                                        style={col.align !== 'left' ? { 'text-align': col.align } : undefined}
                                    >
                                        {!!col.dataIndex ? col.render?.(d[col.dataIndex], d, i, dataSlice()) : col.render?.(d, d, i, dataSlice())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!!props.pagination && (
                <fr-pagination
                    align='end'
                    {...props.pagination}
                >
                </fr-pagination>
            )}
        </div>
    );
});

export default {
    tag: 'fr-table',
    component: Table
};