//run tests
module.exports = {
    src: 'dist/vizabi.js',
    options: {
        outfile: 'test.html',
        keepRunner: true,
        specs: 'spec/**/*-spec.js',
        helpers: 'spec/helper.js',
        styles: ['dist/vizabi.css', 'spec/spec.css'],
        vendor: ['lib/d3/d3.min.js'],
        page: {
            //laptopsize
            viewportSize: {
                width: 1280,
                height: 768
            }
        }
    }
};