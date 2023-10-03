const path = require('path')

module.exports = {
    mode: 'development',
    entry: {
        main: './src/index.tsx',
        'bookmarklet-bootstrap': './src/features/bookmarklet/bootstrap.ts',
        'bookmarklet-main': './src/features/bookmarklet/main.ts',
    },
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
        devMiddleware: {
            writeToDisk: true,
        },
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
