/*
 * DSS
 * https://github.com/darcyclarke/DSS
 *
 * Copyright (c) 2013 darcyclarke
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    dss: {
      docs: {
        options: {
          template: 'template/'
        },
        files: {
          'docs/': 'example/**/*.{css,scss,sass,less,styl}'
        }
      }
    },

    // 
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any files, remove the docs folder
    clean: {
      tests: ['docs']
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    },

  });

  grunt.loadTasks('tasks');

  // Plugins that provide necessary tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the test task is run, cleanup the docs folder and
  // then test the result.
  grunt.registerTask('test', ['clean', 'dss', 'nodeunit']);

  // By default run the DSS task to create docs
  grunt.registerTask('default', ['clean', 'dss']);

};
