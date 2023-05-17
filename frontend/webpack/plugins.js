const webpack = require('webpack')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
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
        inject: true,
    }),
    new MiniCssExtractPlugin({
        filename: '[name].[chunkhash].css',
        chunkFilename: '[name].[chunkhash].chunk.css',
    }),
].filter(Boolean)
