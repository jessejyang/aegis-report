import rollupResolve from 'rollup-plugin-node-resolve'
import alias from 'rollup-plugin-alias'
import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'
import cleanup from 'rollup-plugin-cleanup'
import { minify } from 'uglify-es'

const path = require('path')

const resolve = p => path.resolve(__dirname, './', p)

const builds = {
    'web': {
        entry: resolve('src/index.js'),
        dest: resolve('dist/index.js')
    },
    'wx': {
        entry: resolve('src/platform/wx/entry.js'),
        dest: resolve('dist/index.mp.js')
    }
}

function genConfig (name) {
    const opts = builds[name]
    const config = {
        input: opts.entry,
        external: opts.external,
        plugins: [
            rollupResolve(),
            babel({
                exclude: 'node_modules/**'
            }),
            uglify({}, minify),
            cleanup({
                comments: 'none'
            }),
            alias(Object.assign({}, {
                core: resolve('src/core'),
                shared: resolve('src/shared'),
                web: resolve('src/platforms/web'),
                wx: resolve('src/platforms/wx')
            }, opts.alias))
        ].concat(opts.plugins || []),
        output: {
            file: opts.dest,
            format: opts.format || 'umd',
            banner: opts.banner,
            exports: 'named',
            name: 'wardjs-report',
            sourceMap: false
        },
        onwarn: (msg, warn) => {
            if (!/Circular/.test(msg)) {
                warn(msg)
            }
        }
    }

    return config
}

if (process.env.TARGET) {
    module.exports = genConfig(process.env.TARGET)
} else {
    exports.getBuild = genConfig
    exports.getAllBuilds = () => Object.keys(builds).map(genConfig)
}
