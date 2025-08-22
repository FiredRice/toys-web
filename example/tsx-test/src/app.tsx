import { useComponentInstance, useConnectedCallback, useDeferredValue, useEffect, useShadowRoot, useState, useWatch, WebComponent } from 'toys-web';
// import './app.css';
import { Accessor } from 'toys-web/lib/types/type';
import Link from './components/Link';

const App = WebComponent(() => {
	const instance = useComponentInstance();
	const root = useShadowRoot({ mode: 'open' });

	const [text, setText] = useState<string>('');

	const [className, setClassName] = useState<string | undefined>('aaa');
	const deferredText = useDeferredValue(text);

	const list = new Array(10000).fill(0);

	return () => (
		<div>
			<input
				// value={text()}

				oninput={e => setText(e.target.value || '')}
			/>
			<Link
				onClick={() => console.log('sss')}
			>
				测试
			</Link>
			<button
				type='button'
				className={className()}
				onclick={() => setClassName(undefined)}
			>
				切换
			</button>
			{/* <ul>
				{list.map((_, i) => (
					<li key={i}>
						{deferredText()}
					</li>
				))}
			</ul> */}
		</div>
	);
});

export default App;