import { useComponentInstance, useConnectedCallback, useShadowRoot, useState, WebComponent } from 'toys-web';
import { useRef } from './utils';
import Child from './Child';
import './app.css';

function Child2() {
	return (
		<textarea placeholder="请输入标注" value='ddd'></textarea>
	);
}

const columns = [
	{
		title: 'ID',
		dataIndex: 'id',
		align: 'center',
		render: (value, record) => value
	},
	{
		title: '名字',
		dataIndex: 'name',
		align: 'center',
		render: (value, record) => value
	},
	{
		title: '操作',
		key: 'opt',
		align: 'center',
		render: (value, record, index) => (
			<span onclick={() => console.log(index, record)}>
				编辑
			</span>
		)
	},
];

const dataSource = new Array(508).fill({}).map((_, i) => ({
	id: i + 1,
	name: `张三-${i + 1}`
}));

const App = WebComponent(() => {
	const instance = useComponentInstance();
	const root = useShadowRoot({ mode: 'open' });

	const container = useRef<HTMLDivElement>();

	const [current, setCurrent] = useState<number>(1);
	const [count, setCount] = useState<number>(0);
	const [opacity, setOpacity] = useState(0);
	const [state, setState] = useState<number>(10);

	let listLength = 10;
	// const list = [1, 2, 3];
	const [list, setList] = useState<number[]>([1, 2, 3, 4]);
	const list2 = [4, 5, 6];

	useConnectedCallback(function () {
	});
	function onClick() {
		setOpacity(opacity() ? 0 : 1);
		// setCount(count() + 1);
		// listLength -= 1;
		// const l = list().slice();
		// const v = l.shift();
		// if (v) {
		// 	l.push(v);
		// }
		// setList(l);
		// setList([3, 4, 1, 2]);
		setList([3, 5, 4, 10, 1, 2]);
	}

	function onClick2() {
		const l = list().slice();
		listLength += 1;
		l.push(listLength);
		setList(l);
		setState(state() + 1);
		console.log(container);
	}

	return () => (
		<div>
			<Child name={'略略路'}>
				嘎嘎嘎
			</Child>
			<div>
				{state()}
			</div>
			<button type='button' onclick={onClick}>
				测试
			</button>
			<button type='button' onclick={onClick2}>
				测试2
			</button>
			<div
				ref={container}
				style={{
					transition: 'all 300ms',
					opacity: opacity()
				}}
			>
				测试嗷嗷嗷
			</div>
			{list().map((v, i) => (
				<div
					key={v}
					onclick={() => console.log(v, i)}
				>
					{v}
				</div>
			))}
			<slot>呵呵</slot>
			<Child2 />
			<fr-table
				rowKey='id'
				columns={columns}
				dataSource={dataSource}
				pagination={{
					current: current(),
					total: dataSource.length,
					onChange: setCurrent
				}}
			/>
		</div>
	);
});

export default App;