process.env.NODE_ENV = process.env.NODE_ENV ?? 'production'

const { merge } = require('webpack-merge')
const common = require('./webpack.common')

module.exports = merge(common, {
    mode: 'production',
    output: {
        clean: true,
    },
    optimization: {
        // minimize: false,
        minimize: true,
        sideEffects: true,
        concatenateModules: true,
        // runtimeChunk: 'multiple',
        runtimeChunk: 'single',
        splitChunks: {
            chunks: 'all',
            maxInitialRequests: 10,
            minSize: 0,
            cacheGroups: {
                vendor: {
                    name: 'vendors',
                    test: /[\\/]node_modules[\\/]/,
                    chunks: 'all',
                },
            },
        },
    },
})
