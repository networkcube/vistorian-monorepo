import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import nodeResolve from 'rollup-plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
    input: 'build/src/index.js',
    external: [
        'd3',
        'lz-string',
        'reorder.js',
        'netclustering',
        'swiftset',
        'moment',
        'three',
        'jquery'
    ],
    output: {
        file: 'lib/vistorian-core.js',
        format: 'umd',
        sourcemap: true,
        name: 'vc',
        globals: {
            'd3': 'd3',
            'lz-string': 'LZString',
            'reorder.js': 'reorder',
            'netclustering': 'netClustering',
            'swiftset': 'Set',
            'moment': 'moment',
            'three': 'three',
            'jquery': '$'
        }
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        json(),
        sourcemaps()
    ]
};
