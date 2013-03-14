'use strict';

var grunt = require('grunt');
var fs = require('fs');

exports.DSS = {
  'copy doc assets': function(test) {
    test.expect(6);

    var expects = {};

    expects.docs = grunt.file.isDir('docs');
    expects.css = grunt.file.isDir('docs/assets/css');
    expects.js = grunt.file.isDir('docs/assets/js');
    expects.styles = grunt.file.exists('docs/assets/css/styles.css');
    expects.scripts = grunt.file.exists('docs/assets/js/scripts.js');
    expects.styleguide = grunt.file.exists('docs/index.html');
    expects.template = grunt.file.exists('docs/index.mustache');

    test.equal(expects.docs, true, 'should create the docs directory using DSS');
    test.equal(expects.css, true, 'should create the css directory using DSS');
    test.equal(expects.js, true, 'should create the js directory using DSS');
    test.equal(expects.styles, true, 'should create the styles.css file using DSS');
    test.equal(expects.scripts, true, 'should create the scripts.js file using DSS');
    test.equal(expects.styleguide, true, 'should create the index.html file using DSS');
    // test.equal(expects.template, false, 'should not create the index.mustache file using DSS');

    test.done();
  },

};

