const path = require('path')

module.exports = {
    mode: 'development',
    entry: ['./src/index.tsx'],
    module: {
        rules: require('./rules'),
    },
    output: {
        filename: '[name].js',
        chunkFilename: '[name].chunk.js',
        path: path.resolve(__dirname, '../build'),
        publicPath: '/',
    },
    plugins: require('./plugins'),
    resolve: require('./resolve'),
    stats: 'errors-warnings',
    devtool: 'cheap-module-source-map',
    devServer: {
        port: 3000,
        // open: true,
        historyApiFallback: true,
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    },
    performance: {
        hints: false,
    },
}
