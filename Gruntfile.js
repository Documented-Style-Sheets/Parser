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
			options: {}
		}
	});

	grunt.loadTasks('tasks');
	grunt.registerTask('default', ['DSS']);

};
