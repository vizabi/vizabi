module.exports = {
    test: {
        options: {
            port: 8000,
            keepalive: true,
            hostname: 'localhost',
            livereload: 35728,
            open: 'http://<%= connect.test.options.hostname %>:<%= connect.test.options.port %>/test.html'
        }
    },
    dev: {
        options: {
            port: 9000,
            livereload: 35729,
            hostname: 'localhost',
            open: 'http://<%= connect.dev.options.hostname %>:<%= connect.dev.options.port %>/preview/'
        }
    },
};