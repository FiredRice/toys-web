import './app.css';
import { useState } from './utils';

function Child({ name }, children) {
	return (
		<div>
			{name}
			{children}
		</div>
	);
}

function App() {

	const [count, setCount] = useState<number>(0);
	const [state, setState] = useState<number>(10);

	const list = [1, 2, 3];
	const list2 = [4, 5, 6];
	function onClick() {
		console.log(count());

		setCount(count() + 1);
	}
	function onClick2() {
		console.log(state());

		setState(state() + 1);
	}

	return (
		<div>
			<Child name={'略略路'}>
				嘎嘎嘎
			</Child>
			{count()}
			<button type='button' onclick={onClick}>
				测试
			</button>
			<button type='button' onclick={onClick2}>
				测试2
			</button>
			{false && (
				<span>哈哈哈</span>
			)}
			<ul>
				{list.map(v => (
					<li>
						{state()}{v}
					</li>
				))}
			</ul>
			{list2.map((v, i) => (
				<div>
					{i} - {v}
				</div>
			))}
		</div>
	);
}

export default App;