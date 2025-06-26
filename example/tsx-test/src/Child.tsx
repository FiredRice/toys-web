
export default function Child({ name }, children) {
	return (
		<div>
			{name}
			<>
				{children}
			</>
		</div>
	);
}
