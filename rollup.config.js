import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import nodeResolve from 'rollup-plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
    input: 'build/src/index.js',
    output: {
        file: 'lib/vistorian-core.js',
        format: 'umd',
        sourcemap: true,
        name: 'vc'
    },
    plugins: [
        nodeResolve(),
        commonjs({
            namedExports: {
                'reorder.js': ['optimal_leaf_order'],
                'netclustering':  ['cluster'],
                'swiftset': ['intersection', 'difference'],
                'moment': ['utc', 'unix']
            }
        }),
        json(),
        sourcemaps()
    ]
};
