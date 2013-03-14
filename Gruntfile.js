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
		DSS: {
			docs: {
				options: {
					template: 'template/'
				},
				files: {
					'docs/': 'example/**/*.{css,scss,sass,less,styl}'
				}
			}
		}
	});

	grunt.loadTasks('tasks');
	grunt.registerTask('default', ['DSS']);
};
