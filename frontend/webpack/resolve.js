module.exports = {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
        buffer: require.resolve('buffer/'),
        path: require.resolve('path-browserify'),
        url: require.resolve('url/'),
        util: require.resolve('util/'),
    },
    alias: {
        // Custom Aliases
        ...require('./aliases'),
    },
}
