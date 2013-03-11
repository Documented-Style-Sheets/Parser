/*
 * DSS
 * https://github.com/darcyclarke/DSS
 *
 * Copyright (c) 2013 darcyclarke
 * Licensed under the MIT license.
 */

// Include dependancies
var mustache = require('mustache');
var fs = require('fs');
var path = require('path');
var wrench = require('wrench');

// Expose
module.exports = function(grunt) {

  // Register DSS
  grunt.registerTask('DSS', 'Parse DSS comment blocks', function() {

    // Setup async promise
    var promise = this.async();

    // Merge task-specific and/or target-specific options with defaults
    var options = this.options({
      location: process.cwd(),
      output: process.cwd() + '/docs/',
      template: process.cwd() + '/template/'
    });

    // DSS Object
    var dss = (function(){

      // Store reference
      var _dss = function(){};

      // Detect
      _dss.detect = function(){
        return true;
      };

      /*
       * Modify detector method
       *
       * @param (Function) The callback to be used to detect variables
       */
      _dss.detector = function(callback){ 
        _dss.detect = callback;
      };

      // Store parsers
      _dss.parsers = {};

      /*
       * Add a parser for a specific variable
       *
       * @param (String) The name of the variable
       * @param (Function) The callback to be executed at parse time
       */
      _dss.parser = function(name, callback){
        _dss.parsers[name] = callback;
      };

      /*
       * Trim whitespace from string
       *
       * @param (String) The string to be trimmed
       * @return (String) The trimmed string
       */
      _dss.trim = function(str, arr){
        var defaults = [ /^\s\s*/, /\s\s*$/ ];
        arr = (_dss.isArray(arr)) ? arr.concat(defaults) : defaults;
        arr.forEach(function(regEx){
          str = str.replace(regEx, '');
        });
        return str;
      };

      /*
       * Check if object is an array
       *
       * @param (Object) The object to check
       * @return (Boolean) The result of the test
       */ 
      _dss.isArray = function(obj){
        return toString.call(obj) == '[object Array]';
      };

      /*
       * Squeeze unnecessary extra characters/string
       *
       * @param (String) The string to be squeeze
       * @param (String) The string to be matched
       * @return (String) The modified string
       */
      _dss.squeeze = function(str, def){
        return str.replace(/\s{2,}/g, def); 
      };

      /*
       * Takes and file path of a text file and extracts comments from it.
       *
       * @param (String) path to file
       * @param (Object) options
       */
      _dss.parse = function(options, callback){
        
        // Options
        options = (options) ? options : {};
        options.preserve_whitespace = !!(options.preserve_whitespace);
        
        // Setup
        var _this = this,
            current_block = '',
            inside_single_line_block = false,
            inside_multi_line_block = false,
            start = "{start}",
            end = "{/end}",
            _parsed = false,
            _blocks = [],
            parsed = '',
            blocks = [],
            temp = [],
            lines = grunt.file.read(options.file),
            lineNum = 0;

        /*
         * Parses line
         *
         * @param (Num) the line number
         * @param (Num) number of lines
         * @param (String) line to parse/check
         * @return (Boolean) result of parsing
         */
        var parser = function(lineNum, lines, line){
          var parts = line.replace(/.*@/, ''),
              i = parts.indexOf(' '),
              name = _dss.trim(parts.substr(0, i)),
              description = _dss.trim(parts.substr(i)),
              variable = _dss.parsers[name];
          line = {};
          line[name] = (variable) ? variable.apply(null, [lineNum, description, lines]) : '';
          return line;
        };

        /*
         * Comment block
         */        
        var block = function(){
          this._raw = (comment_text) ? comment_text : '';
          this._filename = filename;
        };

        /*
         * Check for single-line comment
         *
         * @param (String) line to parse/check
         * @return (Boolean) result of check
         */
        var single_line_comment = function(line){
          return !!line.match(/^\s*\/\//);
        };

        /*
         * Checks for start of a multi-line comment
         *
         * @param (String) line to parse/check
         * @return (Boolean) result of check
         */
        var start_multi_line_comment = function(line){
          return !!line.match(/^\s*\/\*/);
        };

        /*
         * Check for end of a multi-line comment
         *
         * @parse (String) line to parse/check
         * @return (Boolean) result of check
         */
        var end_multi_line_comment = function(line){
          if(single_line_comment(line))
            return false;
          return !!line.match(/.*\*\//);
        };

        /*
         * Removes comment identifiers for single-line comments.
         *
         * @param (String) line to parse/check
         * @return (Boolean) result of check
         */
        var parse_single_line = function(line){
          return line.replace(/\s*\/\//, '');
        };

        /* 
         * Remove comment identifiers for multi-line comments.
         *
         * @param (String) line to parse/check
         * @return (Boolean) result of check
         */
        var parse_multi_line = function(line){
          var cleaned = line.replace(/\s*\/\*/, '');
          return cleaned.replace(/\*\//, '');
        };

        lines = lines + '';
        lines.split(/\n/).forEach(function(line){
          
          lineNum = lineNum + 1;
          line = line + '';

          // Parse Single line comment
          if(single_line_comment(line)){
            parsed = _this.parse_single_line(line);
            if(inside_single_line_block){
              current_block += start + parsed + end;
            } else {
              current_block = parsed;
              inside_single_line_block = true;
            }
          } 

          // Parse multi-line comments
          if(start_multi_line_comment(line)){
            current_block += start;
          }
          if(start_multi_line_comment(line) || inside_multi_line_block){
            parsed = parse_multi_line(line);
            if(inside_multi_line_block){
              current_block += parsed;
            } else {
              current_block += parsed;
              inside_multi_line_block = true;
            }
          }

          // End a multi-line block
          if(end_multi_line_comment(line)){
            inside_multi_line_block = false;
            current_block += end;
          }

          // Store current block if done
          if(!single_line_comment(line) || !inside_multi_line_block){
            if(current_block){
              _blocks.push(current_block);
            }
            inside_single_line_block = false;
            current_block = '';
          }
        });
        
        // Create new blocks with custom parsing
        var x = 0, length = _blocks.length;
        _parsed = true;
        _blocks.forEach(function(block){

          // Detect if block is DSS and add to blocks
          if(_dss.detector(block))
            blocks.push(parser(block));

          // Run callback if we're done with blocks
          x++;
          if(x >= length)
            callback({ file: options.file, blocks: blocks });
        
        });

      };

      /*
       * Build
       *
       * @param (String) location to file
       * @param (Object) options
       */
      _dss.build = function(location, template_dir, output_dir){

        // Find all CSS files
        var types = ['*.css', '*.sass', '*.scss', '*.less'],
            files = grunt.file.expand({ matchBase:true }, types),
            length = files.length,
            styleguide = [];

        // Parse files
        files.map(function(filename){
            
          // Report file
          grunt.log.writeln('• ' + path.relative(location, filename));
          
          // Parse
          _dss.parse({ file: filename, path: path.relative(location, filename) }, function(parsed){
            
            // Add comment block to styleguide
            styleguide.push(parsed);

            // Check if we're done
            if(length > 1){
              length = length - 1;
            } else {
              
              // Set output directories
              template_dir = template_dir || '../template';
              output_dir = output_dir || 'styleguide';

              // Set output template and file
              var template = template_dir + 'index.mustache',
                  output = output_dir + 'index.html';

              // Clone template directory structure
              wrench.copyDirSyncRecursive(template_dir, output_dir);

              // Read template
              var html = grunt.file.read(template);
                
              // Create HTML ouput
              html = mustache.render((html + ''), {project: grunt.file.readJSON('package.json'), files:styleguide});

              // Render file
              grunt.file.write(output, html);

              // Report build
              grunt.log.writeln('✓ Styleguide object generated!');
              grunt.log.writeln('✓ Documentation created at: ' + output_dir);

              // Return promise
              promise();

            }

          });

        });

      };

      // Return function
      return _dss;

    })();

    // Describe detection pattern 
    dss.detector(function(line){
      if(typeof line !== 'string')
        return false;
      var reference = line.split("\n\n").pop();
      return !!reference.match(/.*@/);
    });

    // Describe parsing a name
    dss.parser('name', function(i, line, block){
      return line;
    });

    // Describe parsing a description
    dss.parser('description', function(i, line, block){
      return line;
    });

    // Describe parsing a state
    dss.parser('state', function(i, line, block){
      var state = line.split('-');
      return {
        name: (state[0]) ? _dss.trim(state[0].replace('.', ' ').replace(':', ' pseudo-class-')) : '',
        description: (state[1]) ? _dss.trim(state[1]) : ''
      };
    });

    // Describe parsing markup
    dss.parser('markup', function(i, line, block){
      var markup = block.splice(i, block.length).join('');
      return {
        example: markup,
        escaped: String(markup).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      };
    });

    // Parse Utility
    // dss.parse({ file: filename, path: path.relative(location, filename) }, function(styleguide){
    //   console.log('parse utility: ', styleguide);
    // });

    // Build Documentation
    dss.build(options.location, options.template, options.output);

  });

};