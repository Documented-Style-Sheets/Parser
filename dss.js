/**
 * Command Line Tool for DSS (Documented Style Sheets)
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

var lazy = require('lazy');
var fs = require('fs');
var path = require('path');
var program = require('commander');
  
var cli = function(){
  
  program
    .version('0.0.1')
    .command('dss')
    .option('build, -b, --build', 'Build Documentation')
    .description('Build documentation')
    .action(function(cmd, options){
      console.log('building...', cmd, options);
    });
  program.parse(process.argv);

};

////////////////////////////////////////////////////////////////////////////
// DSS
////////////////////////////////////////////////////////////////////////////
var DSS = (function(){

  // Store reference
  var _this = function(){};

  // Reference to trim
  _this.trim = function(){
    return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  };

  ////////////////////////////////////////////////////////////////////////////
  // Takes and file path of a text file and extracts comments from it.
  ////////////////////////////////////////////////////////////////////////////
  _this.CommentParser = function(file_path, options){

    this.options = (options) ? options : {};
    this.options.preserve_whitespace = (options.preserve_whitespace) ? options.preserve_whitespace : false;
    this._file_path = file_path;
    this._blocks = [];
    this._parsed = false;
  
    // Is this a single-line comment? // This style
    this.single_line_comment = function(line){
      return !!(line =~ /^\s*\/\//);
    };

    // Is this the start of a multi-line comment? /* This style */
    this.start_multi_line_comment = function(line){
      return !!(line =~ /^\s*\/\*/);
    };

    // Is this the end of a multi-line comment? /* This style */
    this.end_multi_line_comment = function(line){
      if(this.single_line_comment(line))
        return false;
      return !!(line =~ /.*\*\//);
    };

    // Removes comment identifiers for single-line comments.
    this.parse_single_line = function(line){
      return line.replace(/\s*\/\//, '');
    };

    // Remove comment identifiers for multi-line comments.
    this.parse_multi_line = function(line){
      cleaned = line.replace(/\s*\/\*/, '');
      return cleaned.replace(/\*\//, '');
    };

    // The different sections of parsed comment text. A section is
    // either a multi-line comment block's content, or consecutive lines of
    // single-line comments.
    this.blocks = function(){
      return this._parsed ? this._blocks : this.parse_blocks;
    };

    //Parse the file for comment blocks and populate them into @blocks.
    this.parse_blocks = function(){
      
      var current_block = false,
          inside_single_line_block = false,
          inside_multi_line_block = false,
          parsed = '';
      
      new lazy(fs.createReadStream(this._file_path))
        .lines
        .forEach(function(line){
          
          line = line.toString();
          
          // Parse Single line comment
          if(this.single_line_comment(line){
            parsed = this.parse_single_line(line);
            if(inside_multi_line_block){
              current_block += "\n#{" + parsed + "}";
            } else {
              current_block = parsed;
              inside_single_line_block = true;
            }
          } 

          // Parse multi-line comments
          if(this.start_multi_line_coment(line) || this.inside_multi_line_block(line)){
            parsed = this.parse_multi_line(line);
            if(inside_multi_line_block){
              current_block += "\n{#" + parsed + "}";
            } else {
              current_block = parsed;
              inside_multi_line_block = true;
            }
          }

          // End a multi-line block
          inside_multi_line_block = (this.end_multi_line_comment(line)) ? false : inside_multi_line_block;

          // Store current block if done
          if(!this.single_line_comment(line) || !inside_multi_block){
            if(current_block)
              this._blocks.push(this.normalize(current_block));
            inside_sindle_line_block = false;
            current_block = false;
          }

        
        });

        this._parsed = true;
        return this._blocks;
      }

      // Normalizes the comment block to ignore any consistent preceding
      // whitespace. Consistent means the same amount of whitespace on every line
      // of the comment block. Also strips any whitespace at the start and end of
      // the whole block.
      this.normalize = function(text_block){
        if(this.options.preserve_whitespace)
          return text_block;

        // Strip out any preceding [whitespace]* that occur on every line. Not
        // the smartest, but I wonder if I care.
        text_block = text_block.replace(/^(\s*\*+)/, '')

        // Strip consistent indenting by measuring first line's whitespace
        var indent_size = false;
        var unindented = (function(lines){
          return lines.map(function(){
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
      
        return _this.trim(unindented);
      
      };

    };

  };

  ////////////////////////////////////////////////////////////////////////////
  // Represents a style modifier. Usually a class name or a
  // pseudo-class such as :hover. See the spec on The Modifiers Section for
  // more information.
  ////////////////////////////////////////////////////////////////////////////
  _this.Modifier = function(name, description){
       
      // Returns the modifier name String.
      this.name = name;
      this.description = description;

      // The modifier name as a CSS class. For pseudo-classes, a
      // generated class name is returned. Useful for generating styleguides.
      this.class_name = function(){
        return _this.trim(this.name.replace('.', ' ').replace(':', ' pseudo-class-'));
      };
  };

  ////////////////////////////////////////////////////////////////////////////
  // The main KSS parser. Takes a directory full of SASS / SCSS / CSS
  // files and parses the KSS within them.
  ////////////////////////////////////////////////////////////////////////////
  _this.Parser = function(paths){
    this.sections = {};
    paths.map(function(){
      var filename = "#{" + this + "}/**/*.*";
      var parser = new _this.CommentParser(filename);
      parser.blocks.map(function(){
        if(this.dss_block(comment_block))
          this.add_section(comment_block, filename);
      });
    });
  
    // Add section
    this.add_ssection = function(comment_text, filename){
      var base_name = filename; // TODO, basename file directive
      section = new _this.Section(comment_text, base_name);
      this.sections[section.section] = section;
    };

    // Public: Takes a cleaned (no comment syntax like // or /* */) comment
    // block and determines whether it is a KSS documentation block.
    this.dss_block = function(cleaned_comment){
      if(typeof cleaned_comment !== 'String')
        return false;
      var possible_reference = cleaned_comment.split("\n\n").pop();
      return possible_reference.match(/Styleguide \d/).length > 0; // TODO, check validty
    };

    // Finds the Section for a given styleguide reference.
    this.section = function(reference){
      return this.sections[reference] || new _this.Section();
    };

  };

  ////////////////////////////////////////////////////////////////////////////
  // Represents a styleguide section. Each section describes one UI
  // element. A Section can be thought of as the collection of the description,
  // modifiers, and styleguide reference.
  ////////////////////////////////////////////////////////////////////////////
  _this.Section = function(comment_text, filename){

    this.raw = comment_text;
    this.filename = filename;

    // Splits up the raw comment text into comment sections that represent
    // description, modifiers, etc.
    this.comment_sections = function(){
      return (this.comment_sections)
    };
  };

  // TODO, finish Section Class port
  // TODO, do tests with node
  // TODO, look up commander.js further
  // TODO, rework /bin/dss to work -g in terminal/shell
  // TODO, fix npm package
  // TODO, add more documentation to readme.md


  // Return function
  return _this;

})();






