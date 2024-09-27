import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
	input: 'lib/esm6/index.js',
	output: [
		{
			name: 'ToysWeb',
			format: 'umd',
			file: 'lib/bundles/toys-web.umd.js',
			sourcemap: false,
		},
		{
			name: 'ToysWeb',
			format: 'umd',
			file: 'lib/bundles/toys-web.umd.min.js',
			sourcemap: false,
			plugins: [terser()],
		},
		{
			format: 'es',
			file: 'lib/bundles/toys-web.es.min.js',
			sourcemap: false,
			plugins: [terser()],
		},
	],
	onwarn: function (warning) {
		if (warning.code === 'THIS_IS_UNDEFINED') {
			return;
		}
		console.error(warning.message);
	},
	plugins: [commonjs(), nodeResolve()],
};
