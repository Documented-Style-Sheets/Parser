/**
 * Command Line Tool for _dss (Documented Style Sheets)
 * @author Darcy Clarke
 * @version 0.0.1
 * 
 * Dual licensed under the MIT and GPL licenses.
 *
 * This library contains a Node.js port of the KSS 
 * Ruby library. All the JavaScript code, accept where 
 * explicitly noted, was written by Darcy Clarke.
 *
 * Based on KSS: https://github.com/kneath/kss
 * @author Kyle Neath
 */

// Include dependancies
var mustache = require('mustache');
var fs = require('fs');
var path = require('path');

// DSS Object
var dss = (function(){

  // Store reference
  var _dss = function(){};

  _dss.queue = {};
  _dss.variables = {};

  _dss.publish = function(topic, args){
      _dss.queue[topic] && _dss.queue[topic].forEach(function(callback){
          callback.apply(_dss, args || []);
      });
  };
  
  _dss.subscribe = function(topic, callback){
      if(!_dss.queue[topic])
          _dss.queue[topic] = [];
      _dss.queue[topic].push(callback);
      return [topic, callback];
  };
  
  _dss.unsubscribe = function(handle){
      var t = handle[0];
      _dss.queue[t] && _dss.queue[t].forEach(function(idx){
          if(this == handle[1])
              _dss.queue[t].splice(idx, 1);
      });
  };

  _dss.describe = function(name, callback){
    _dss.variables[name] = callback;
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
   * Get last item in array
   *
   * @param (Array) The array to use
   * @return (Object) The last item in the array
   */
  _dss.last = function(arr){
    return arr[arr.length - 1] || [];
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
   * Walks the directory structure looking for CSS files
   *
   * @param (String) The directory to crawl
   * @param (Function) The callback function to be executed when done
   */
  _dss.walker = function(dir, callback) {
    var results = [];
    fs.readdir(dir, function(err, list) {
      if (err) return callback(err);
      var pending = list.length;
      if (!pending) return callback(null, results);
      list.forEach(function(file) {
        file = dir + '/' + file;
        fs.stat(file, function(err, stat) {
          if (stat && stat.isDirectory()) {
            _dss.walker(file, function(err, res) {
              results = results.concat(res);
              if (!--pending) callback(null, results);
            });
          } else {
            var ext = file.substr((file.lastIndexOf('.')+1), file.length);
            if(ext === 'css' || ext === 'sass' || ext === 'less' || ext === 'scss')
              results.push(file);
            if (!--pending) callback(null, results);
          }
        });
      });
    });
  };

  /*
   * Recursively create directories
   *
   * @param (String) path of the directory to create
   * @param (Number) chmod mode to set the directories at
   * @param (Function) The callback function to be executed when complete
   * @param (Number) Current position in the split path array
   */
  _dss.mkdir = function(path, mode, callback, position) {
    mode = mode || 0777;
    position = position || 0;
    parts = require('path').normalize(path).split('/');
    if(position >= parts.length){
        if (callback) {
            return callback();
        } else {
            return true;
        }
    }
    var directory = parts.slice(0, position + 1).join('/');
    fs.stat(directory, function(err) {
        if (err === null) {
            _dss.mkdir(path, mode, callback, position + 1);
        } else {
            fs.mkdir(directory, mode, function (err) {
                if (err) {
                    if (callback) {
                        return callback(err);
                    } else {
                        throw err;
                    }
                } else {
                    _dss.mkdir(path, mode, callback, position + 1);
                }
            })
        }
    });
  };

  /*
   * Create a file 
   * 
   * @param (String) The path to the file to create
   * @param (String) The contents to write to the file
   * @param (Function) The callback function when done creation
   */
  _dss.writeFile = function(path, contents, callback){
    var directories = path.split('/');
    directories.pop();
    _dss.mkdir(directories.join('/'), 0777, function(){
      fs.writeFile(path, contents, callback);
    });
  };

  /*
   * Takes and file path of a text file and extracts comments from it.
   *
   * @param (String) path to file
   * @param (Object) options
   */
  _dss.parser = (function(){

    var _this = function(file_path, relative, options){
      this.options = (options) ? options : {};
      this.options.preserve_whitespace = !!(this.options.preserve_whitespace);
      this._file = file_path;
      this._relative = relative;
      this._blocks = [];
      this._parsed = false;    
    };

    /*
     * Check for single-line comment
     *
     * @param (String) line to parse/check
     * @return (Boolean) result of check
     */
    _this.prototype.single_line_comment = function(line){
      return !!line.match(/^\s*\/\//);
    };

    /*
     * Checks for start of a multi-line comment
     *
     * @param (String) line to parse/check
     * @return (Boolean) result of check
     */
    _this.prototype.start_multi_line_comment = function(line){
      return !!line.match(/^\s*\/\*/);
    };

    /*
     * Check for end of a multi-line comment
     *
     * @parse (String) line to parse/check
     * @return (Boolean) result of check
     */
    _this.prototype.end_multi_line_comment = function(line){
      if(this.single_line_comment(line))
        return false;
      return !!line.match(/.*\*\//);
    };

    /*
     * Removes comment identifiers for single-line comments.
     *
     * @param (String) line to parse/check
     * @return (Boolean) result of check
     */
    _this.prototype.parse_single_line = function(line){
      return line.replace(/\s*\/\//, '');
    };

    /* 
     * Remove comment identifiers for multi-line comments.
     *
     * @param (String) line to parse/check
     * @return (Boolean) result of check
     */
    _this.prototype.parse_multi_line = function(line){
      var cleaned = line.replace(/\s*\/\*/, '');
      return cleaned.replace(/\*\//, '');
    };

    /*
     * The different sections of parsed comment text. A section is
     * either a multi-line comment block's content, or consecutive lines of
     * single-line comments.
     *
     * @return (Array) The array of parsed lines/blocks
     */
    _this.prototype.blocks = function(callback){
      return this._parsed ? this._blocks : this.parse_blocks(callback);
    };

    /* 
     * Parse the file for comment blocks and populate them into this._blocks.
     *
     * @return (Array) The array of blocks
     */
    _this.prototype.parse_blocks = function(callback){
      
      var current_block = '',
          inside_single_line_block = false,
          inside_multi_line_block = false,
          parsed = '',
          _that = this,
          start = "{start}",
          end = "{/end}",
          blocks = [];

      fs.readFile(this._file, function(err, lines){

        var lineNum = 0;

        if(err){
          console.error("× Build error: [parse_blocks] %s", err);
          process.exit(1);
        }

        lines = lines + '';

        lines.split(/\n/).forEach(function(line){
          
          lineNum = lineNum + 1;
          line = line + '';

          // Parse Single line comment
          if(_that.single_line_comment(line)){
            parsed = _that.parse_single_line(line);
            if(inside_single_line_block){
              current_block += start + parsed + end;
            } else {
              current_block = parsed;
              inside_single_line_block = true;
            }
          } 

          // Parse multi-line comments
          if(_that.start_multi_line_comment(line)){
            current_block += start;
          }
          if(_that.start_multi_line_comment(line) || inside_multi_line_block){
            parsed = _that.parse_multi_line(line);
            if(inside_multi_line_block){
              current_block += parsed;
            } else {
              current_block += parsed;
              inside_multi_line_block = true;
            }
          }

          // End a multi-line block
          if(_that.end_multi_line_comment(line)){
            inside_multi_line_block = false;
            current_block += end;
          }

          // Store current block if done
          if(!_that.single_line_comment(line) || !inside_multi_line_block){
            if(current_block){
              _that.normalize(current_block);
              _that._blocks.push(_that.normalize(current_block));
            }
            inside_single_line_block = false;
            current_block = '';
          }

        });
        
        _that._parsed = true;
        var x = 0, length = _that._blocks.length;
        _that._blocks.forEach(function(block){
          if(_that.dss_block(block)){
            var parts = block.replace(/.*@/, ''),
                i = parts.indexOf(' '),
                name = _dss.trim(parts.substr(0, i)),
                description = _dss.trim(parts.substr(i)),
                variable = _dss.variables[name];
            block = {};
            block[name] = (variable) ? variable.apply(_that, [ lineNum, description, lines ] ) : '';
            blocks.push( block );
          }
          x++;
          if(x >= length){
            delete _that.options;
            callback({ file: _that._relative, blocks: blocks });
          }
        });

      });
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
    _this.prototype.normalize = function(text_block){
      if(this.options.preserve_whitespace)
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

    /*
     * Takes a block and checks if it is a DSS block
     *
     * @param (String) Cleaned up comment
     * @return (Boolean) Result of conformity check 
     */
    _this.prototype.dss_block = function(cleaned_comment){
      if(typeof cleaned_comment !== 'string')
        return false;
      var possible_reference = cleaned_comment.split("\n\n").pop();
      return possible_reference.match(/.*@/);
    };

    // Return function
    return _this;

  })();

  /*
   * Comment Block
   */
  _dss.block = (function(){

    var _this = function(comment_text, filename){
      this._raw = (comment_text) ? comment_text : '';
      this._filename = filename;
    };

    // The states section of a styleguide comment block.
    _this.prototype.states = function(){
      var last_indent = 0,
          states = [];

      this.states.split("\n").map(function(){
        var line = this,
            next = (_dss.trim(line) === ''),
            indent = line.match(/^\s*/)[0].length;

        if(last_indent && (indent > last_indent)){
          _dss.last(states).description += _dss.squeeze(line);
        } else {
          var split = line.split(" - "),
              state = split[0],
              desc = split[1];
          if(state && desc)
            states += new _dss.state(_dss.trim(state), _dss.trim(desc));
        }
        last_indent = indent;
      });

      return states;
    };

    // Return function
    return _this;

  })();

  /*
   * Build
   *
   * @param (String) location to file
   * @param (Object) options
   */
  _dss.build = (function(){

    _this = function(location, template_dir, output_dir){

      // Walk through files
      _dss.walker(location, function(err, files){
          
        // Setup
        var styleguide = [],
            parsing = files.length;

        // Describe to parsing name
        _dss.describe('name', function(i, line, block){
          return line;
        });

        // Describe to parsing description
        _dss.describe('description', function(i, line, block){
          return line;
        });

        // Describe parsing state
        _dss.describe('state', function(i, line, block){
          var state = line.split('-');
          return {
            name: (state[0]) ? _dss.trim(state[0].replace('.', ' ').replace(':', ' pseudo-class-')) : '',
            description: (state[1]) ? _dss.trim(state[1]) : ''
          };
        });

        // Describe parsing markup
        _dss.describe('markup', function(i, line, block){
          return block.splice(i, block.length).join('');
        });

        // Subscribe to parsing comlete
        _dss.subscribe('parsing:complete', function(){

          console.log('✓ Styleguide Object: ', styleguide);
            
          // Setup output directories
          template_dir = template_dir || '../template';
          output_dir = output_dir || 'styleguide';
          
          // Setup output template and file
          var template = template_dir + '/default.mustache',
              output = output_dir + '/index.html';
          fs.readFile(template, function(err, html){
            
            // Check for build error
            if(err){ 
              console.error('× Build error: [readFile] %s', err);
              process.exit(1);
            } else {

              // Create HTML ouput
              html = mustache.render((html + ''), styleguide);

              // Render file
              _dss.writeFile(output, html, function(err){
                if(err){
                  console.error('× Build error: [writeFile] %s', err);
                  process.exit(1);
                } else {
                  console.log('✓ Build complete');
                }
              });

            }

          });

        });

        // Parse
        files.map(function(filename){
          console.log('• ' + path.relative(location, filename));
          var parser = new _dss.parser(filename, path.relative(location, filename));
          parser.parse_blocks(function(parsed){
            styleguide.push(parsed);
            if(parsing > 1){
              parsing = parsing - 1;
            } else {
              _dss.publish('parsing:complete');
            }
          });
        });

      });

    };

    // Return function
    return _this;

  })();

  // Return function
  return _dss;

})();

// Export for Require.js and other AMD
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = dss;
  }
  exports.dss = dss;
} else {
  root['dss'] = dss;
}

if (typeof define === 'function' && define.amd) {
  define(function(require) {
    return dss;
  });
} 