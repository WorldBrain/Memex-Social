const webpack = require('webpack')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const { inDev } = require('./helpers')
const getClientEnvironment = require('./env')

module.exports = [
    new ForkTsCheckerWebpackPlugin(),
    inDev() && new webpack.HotModuleReplacementPlugin(),
    inDev() && new ReactRefreshWebpackPlugin(),
    new webpack.DefinePlugin(getClientEnvironment('/').stringified),
    new HtmlWebpackPlugin({
        template: 'src/index.html',
        // favicon: 'assets/images/logo.png',
        chunks: ['main'],
    }),
    new MiniCssExtractPlugin({
        filename: '[name].[chunkhash].css',
        chunkFilename: '[name].[chunkhash].chunk.css',
    }),
    new CopyPlugin({
        patterns: [
            {
                from: 'node_modules/pdfjs-dist/web/viewer.css',
                to: 'pdfjs/',
            },
            {
                from: 'node_modules/pdfjs-dist/web/viewer.js',
                to: 'pdfjs/',
            },
            {
                from: 'node_modules/pdfjs-dist/web/viewer.html',
                to: 'pdfjs/',
            },
            {
                from:
                    'node_modules/pdfjs-dist/web/locale/en-US/viewer.properties',
                to: 'pdfjs/locale/locale.properties',
            },
            {
                from:
                    'node_modules/pdfjs-dist/web/locale/en-US/viewer.properties',
                to: 'pdfjs/',
            },
            {
                from: 'node_modules/pdfjs-dist/web/images/*',
                to: 'pdfjs/images/[name][ext]',
            },

            { from: 'node_modules/pdfjs-dist/build/pdf.js', to: 'build/' },
            {
                from: 'node_modules/pdfjs-dist/build/pdf.worker.js',
                to: 'build/',
            },
            {
                from: 'node_modules/pdfjs-dist/build/pdf.worker.js',
                to: 'build/pdf.worker.min.js',
            },
        ],
    }),
].filter(Boolean)
