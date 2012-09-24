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

  /*
   * Trim whitespace from string
   *
   * @param (String) The string to be trimmed
   * @return (String) The trimmed string
   */
  _dss.trim = function(str){
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  };

  /*
   * Get last item in array
   *
   * @param (Array) The array to use
   * @return (Object) The last item in the array
   */
  _dss.last = function(arr){
    return arr[arr.length - 1];
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
  _dss.CommentParser = (function(){

    var _this = function(file_path, options){
      this.options = (options) ? options : {};
      this.options.preserve_whitespace = (this.options.preserve_whitespace) ? this.options.preserve_whitespace : false;
      this.sections = [];
      this._file_path = file_path;
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
      cleaned = line.replace(/\s*\/\*/, '');
      return cleaned.replace(/\*\//, '');
    };

    /*
     * The different sections of parsed comment text. A section is
     * either a multi-line comment block's content, or consecutive lines of
     * single-line comments.
     *
     * @return (Array) The array of parsed lines/blocks
     */
    _this.prototype.blocks = function(){
      return this._parsed ? this._blocks : this.parse_blocks();
    };

    /* 
     * Parse the file for comment blocks and populate them into this._blocks.
     *
     * @return (Array) The array of blocks
     */
    _this.prototype.parse_blocks = function(){
      
      var current_block = '',
          inside_single_line_block = false,
          inside_multi_line_block = false,
          parsed = '',
          sections = {};
          _that = this;

      fs.readFile(this._file_path, function(err, lines){

        if(err){
          console.error("× Build error: [parse_blocks] %s", err);
          process.exit(1);
        }

        lines = lines + '';
        lines.split(/\n/).forEach(function(line){
          
          line = line + '';

          // Parse Single line comment
          if(_that.single_line_comment(line)){
            parsed = _that.parse_single_line(line);
            if(inside_multi_line_block){
              current_block += "\n#{" + parsed + "}";
            } else {
              current_block = parsed;
              inside_single_line_block = true;
            }
          } 

          // Parse multi-line comments
          if(_that.start_multi_line_comment(line) || inside_multi_line_block){
            parsed = _that.parse_multi_line(line);
            if(inside_multi_line_block){
              current_block += "\n{#" + parsed + "}";
            } else {
              current_block = parsed;
              inside_multi_line_block = true;
            }
          }

          // End a multi-line block
          inside_multi_line_block = (_that.end_multi_line_comment(line)) ? false : inside_multi_line_block;

          // Store current block if done
          if(!_that.single_line_comment(line) || !inside_multi_line_block){
            if(current_block){
              _that.normalize(current_block);
              _that._blocks.push(_that.normalize(current_block));
            }
            // console.log(_that._blocks);
            inside_single_line_block = false;
            current_block = '';
          }

        });
        
        _that._parsed = true;
        _that._blocks.forEach(function(block){
          if(_that.dss_block(block)){
            _that.add_section(block, _that._file_path);
          }
        });
        console.log(_that.sections);

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
     * Takes a cleaned (no comment syntax) comment
     * block and determines whether it is a KSS/DSS documentation block.
     *
     * @param (String) Cleaned up comment
     * @return (Boolean) Result of conformity check 
     */
    _this.prototype.dss_block = function(cleaned_comment){
      if(typeof cleaned_comment !== 'string'){
        return false;
      }
      var possible_reference = cleaned_comment.split("\n\n").pop();
      return possible_reference.match(/Styleguide \d/);
    };

    /*
     * Add section
     *
     * @param (String) comment text
     * @param (String) file name
     */
    _this.prototype.add_section = function(comment_text, filename){
      var section = new _dss.Section(comment_text, filename);
      this.sections[section.section()] = section;
    };

    /*
     * Finds the Section for a given styleguide reference.
     *
     * @param (String) name of section
     * @return (Object) A reference or blank section
     */
    _this.prototype.section = function(reference){
      return this.sections[reference] || new _dss.Section();
    };

    // Return function
    return _this;

  })();

  /*
   * Represents a style modifier. Usually a class name or a
   * pseudo-class such as :hover. See the spec on The Modifiers Section for
   * more information.
   *
   * @param (String) name
   * @param (String) description
   */
  _dss.Modifier = (function(){

    var _this = function(name, description){
      // Returns the modifier name String.
      this._name = name;
      this._description = description;
    };

    /*
     * The modifier name as a CSS class. For pseudo-classes, a
     * generated class name is returned. Useful for generating styleguides.
     *
     * @return (String) The trimed class name
     */
    _this.class_name = function(){
      return _dss.trim(this._name.replace('.', ' ').replace(':', ' pseudo-class-'));
    };
    
    // Return function
    return _this;

  })();

  /* 
   * The main KSS parser. Takes a directory full of SASS / SCSS / CSS
   * files and parses the KSS within them.
   *
   * @param (Array) Array of paths
   * @return (Array) Array of paths that contain styles
   */
  _dss.Parser = (function(){
    var _this = function(paths, root){
      paths.map(function(filename){
        console.log('• ' + path.relative(root, filename));
        var parser = new _dss.CommentParser(filename);
        parser.parse_blocks();
      });
    };

    return _this;

  })();

  /*
   * Represents a styleguide section. Each section describes one UI
   * element. A Section can be thought of as the collection of the description,
   * modifiers, and styleguide reference.
   */
  _dss.Section = (function(){

    var _this = function(comment_text, filename){
      this._raw = (comment_text) ? comment_text : '';
      this._filename = filename;
    };

    // Splits up the raw comment text into comment sections that represent
    // description, modifiers, etc.
    _this.prototype.comment_sections = function(){
      return this._comment_sections = this._raw.split("\n\n");
    };

    // The styleguide section for which this comment block references.
    _this.prototype.section = function(){
      if(this._section)
        return this._section;
      var cleaned = _dss.trim(this.section_comment()).replace(/\.$/, '');
      return this._section = cleaned.match(/Styleguide (.+)/)[1];
    };

    // The description section of a styleguide comment block.
    _this.prototype.description = function(){
      this._comment_sections.reject.map(function(){
        return this.section_comment() || this.modifiers_comment();
      })().join("\n\n");
    };

    // The modifiers section of a styleguide comment block.
    _this.prototype.modifiers = function(){
      var last_indent = 0,
          modifiers = [];

      if(this.modifers_comment())
        return modifiers;

      this.modifiers_comment().split("\n").map(function(){
        var line = this,
            next = (_dss.trim(line) === ''),
            indent = line.match(/^\s*/)[0].length;

        if(last_indent && (indent > last_indent)){
          _dss.last(modifiers).description += _dss.squeeze(line);
        } else {
          var split = line.split(" - "),
              modifier = split[0],
              desc = split[1];
          if(modifier && desc)
            modifiers += new _dss.Modifier(_dss.trim(modifier), _dss.trim(desc));
        }
        last_indent = indent;
      });

      return modifiers;
    };

    // Section Comment
    _this.prototype.section_comment = function(){
      return (function(sections){
          var text = '';
          for(var i=0;i<sections.length;i++){
            var res = sections[i].match(/Styleguide \d/i);
            text += (res) ? res : ''; 
          }
        return text;
      })(this.comment_sections());
    };
    
    // TODO: reject logic
    _this.prototype.modifiers_comment = function(){
      return this._comment_sections;
      /*
      comment_sections[1..-1].reject do |section|
        section == section_comment
      end.last
      */
    };

    // Return function
    return _this;

  })();

  /*
   * Build
   *
   * @param (String) path to file
   * @param (Object) options
   */
  _dss.Build = (function(){

    _this = function(path, template_dir, output_dir){
      _dss.walker(path, function(err, files){
        var styleguide = new _dss.Parser(files, path);
        console.log('✓ Styleguide Object: ', styleguide);
        template_dir = template_dir || '../template';
        output_dir = output_dir || 'styleguide';
        _this.render(template_dir, output_dir, styleguide);
      });
    };

    _this.render = function(template, output, styleguide){
      _dss.walker

      template = template + '/default.mustache';
      output = output + '/index.html';
      fs.readFile(template, function(err, html){
        if(err){ 
          console.error('× Build error: [readFile] %s', err);
          process.exit(1);
        }
        html = mustache.render((html + ''), styleguide);
        _dss.writeFile(output, html, function(err) {
          if(err){
            console.error('× Build error: [writeFile] %s', err);
            process.exit(1);
          } else {
            console.log('✓ Build process complete.');
          }
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