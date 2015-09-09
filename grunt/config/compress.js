// Compresses dist files to zip
module.exports = {
    main: {
    options: {
      archive: 'download/vizabi.zip'
    },
    files: [
      {src: ['dist/*'], dest: '', expand: true}
    ]
  }
};