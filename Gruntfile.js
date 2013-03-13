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
			options: {
				location: process.cwd(),
				output: process.cwd() + '/docs/',
      			template: process.cwd() + '/template/'
			}
		}
	});

	grunt.loadTasks('tasks');
	grunt.registerTask('default', ['DSS']);

};
