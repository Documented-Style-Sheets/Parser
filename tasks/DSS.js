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
       * Check if object is empty
       *
       * @param (Object) The object to check if it's empty
       * @return (Boolean) The result of the test
       */ 
      _dss.isEmpty = function(obj){
        if (obj === null || obj === undefined) 
          return true;
        if (obj.length && obj.length > 0) 
          return false;
        if (obj.length === 0) 
          return true;
        for(var key in obj){
          if(Object.prototype.hasOwnProperty.call(obj, key))
            return false;
        }
        return true;
      }

      /*
       * Iterate over an object
       *
       * @param (Object) The object to iterate over
       * @param (Function) Callback function to use when iterating
       * @param (Object) Optional context to pass to iterator
       */
      _dss.each = function(obj, iterator, context){
        if(obj == null) return;
        if(obj.length === +obj.length){
          for(var i = 0, l = obj.length; i < l; i++){
            if(iterator.call(context, obj[i], i, obj) === {}) return;
          }
        } else {
          for(var key in obj){
            if(_.has(obj, key)){
              if(iterator.call(context, obj[key], key, obj) === {}) return;
            }
          }
        }
      };

      /*
       * Extend an object
       *
       * @param (Object) The object to extend
       */
      _dss.extend = function(obj){
        _dss.each(Array.prototype.slice.call(arguments, 1), function(source){
          if(source){
            for(var prop in source){
              obj[prop] = source[prop];
            }
          }
        });
        return obj;
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
            temp = {},
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
        var parser = function(block, lineNum, lines, line){
          var parts = line.replace(/.*@/, ''),
              i = parts.indexOf(' '),
              name = _dss.trim(parts.substr(0, i)),
              description = _dss.trim(parts.substr(i)),
              variable = _dss.parsers[name];
          line = {};
          line[name] = (variable) ? variable.apply(null, [lineNum, description, lines]) : '';

          if(block[name]){
            if(!_dss.isArray(block[name]))
              block[name] = [ block[name] ];
            block[name].push(line[name]);
          } else {
            block = _dss.extend(block, line);
          }
          return block;
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

        /*
         * Normalizes the comment block to ignore any consistent preceding
         * whitespace. Consistent means the same amount of whitespace on every line
         * of the comment block. Also strips any whitespace at the start and end of
         * the whole block.
         *
         * @param (String) Text block
         * @return (String) A cleaned up text block
         */
         var normalize = function(text_block){
          if(options.preserve_whitespace)
            return text_block;

          // Strip out any preceding [whitespace]* that occur on every line. Not
          // the smartest, but I wonder if I care.
          text_block = text_block.replace(/^(\s*\*+)/, '');

          // Strip consistent indenting by measuring first line's whitespace
          var indent_size = false;
          var unindented = (function(lines){
            return lines.map(function(line){
              var preceding_whitespace = line.match(/^\s*/)[0].length;
              if(!indent_size)
                indent_size = preceding_whitespace;
              if(line == ''){
                return '';
              } else if(indent_size <= preceding_whitespace && indent_size > 0){
                return line.slice(indent_size, (line.length - 1));
              } else {
                return line;
              }
            }).join("\n");
          })(text_block.split("\n"));

          return _dss.trim(text_block);

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
        _parsed = true;
        _blocks.forEach(function(block, index){
          
          // Detect if we're done
          var check = block.match(end, 'gi');   
          
          // Detect if we need to add to temporary array
          block = normalize(block);
          if(_dss.detect(block))
            temp = parser(temp, index, lines, block);
          
          // Push into blocks if we're done
          if(check){
            if(!_dss.isEmpty(temp))
              blocks.push(temp);
            temp = {};
          }

        });

        callback({ file: options.file, blocks: blocks });

      };

      /*
       * Build
       *
       * @param (String) location to file
       * @param (Object) options
       */
      _dss.build = function(location, template_dir, output_dir){
        
        // Find all CSS files
        var negate = function(dir){ return '!' + path.relative(process.cwd(), dir) + '/**'; },
            types = [
              '*.css', 
              '*.sass', 
              '*.scss', 
              '*.less', 
              negate(template_dir), 
              negate(output_dir),
              '!node_modules/**'
            ], 
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

            console.log(JSON.stringify(styleguide));

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
        name: (state[0]) ? dss.trim(state[0].replace('.', ' ').replace(':', ' pseudo-class-')) : '',
        description: (state[1]) ? dss.trim(state[1]) : ''
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

    // Describe custom parsers
    for(key in options.parsers){
      dss.parser(key, options.parsers[key]);
    }

    // Build Documentation
    dss.build(options.location, options.template, options.output);

  });

};