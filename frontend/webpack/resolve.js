module.exports = {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
        buffer: require.resolve('buffer/'),
        path: require.resolve('path-browserify'),
        url: require.resolve('url/'),
        util: require.resolve('util/'),
        // These are all used by `jsdom` which Memex Social frontend doesn't actually use
        fs: false,
        os: false,
        net: false,
        tls: false,
        http: false,
        zlib: false,
        https: false,
        stream: false,
        crypto: false,
        assert: false,
        process: false,
        perf_hooks: false,
        child_process: false,
        jsdom: false,
    },
    alias: {
        react: require.resolve('react'),
        'react-dom': require.resolve('react-dom'),
        'styled-components': require.resolve('styled-components'),
    },
}
