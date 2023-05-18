module.exports = {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
        buffer: require.resolve('buffer/'),
        path: require.resolve('path-browserify'),
        url: require.resolve('url/'),
        util: require.resolve('util/'),
    },
    alias: {
        react: require.resolve('react'),
        'react-dom': require.resolve('react-dom'),
        'styled-components': require.resolve('styled-components'),
    },
}
