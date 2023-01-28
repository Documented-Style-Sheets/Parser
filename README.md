[![npm](https://img.shields.io/npm/v/dss.svg?maxAge=2592000&style=flat-square)](https://www.npmjs.com/package/dss)
[![npm](https://img.shields.io/npm/dt/dss.svg?maxAge=2592000&style=flat-square)](https://www.npmjs.com/package/dss)

> ⚠️ **Warning:** this project has moved on `npmjs.com` from `"dss"` to [`"@documented-style-sheets/parser"`](https://npmjs.org/package/@documented-style-sheets/parser)

**DSS**, Documented Style Sheets is a general-purpose comment guide and parser (ex. CSS, LESS, STYLUS, SASS, SCSS & JS comments). This project does static file analysis and parsing to generate an object to be used for generating styleguides.


##### Table of Contents

- [Installation](#installation)
- [Parsing a File](#parsing-a-file)
  - [`dss.detector`](#dssdetector-callback-)
  - [`dss.parser`](#dssparser-name-callback-)
- [Other Projects](#other-projects)

### Installation

```bash
npm i @documented-style-sheets/parser
```

### Parsing a File

In most cases, you will want to include the **DSS** parser in a build step that will generate documentation files automatically (or you just want to play around with this returned `Object` for other means); Either way, we officially support a [Grunt Plugin](https://github.com/dsswg/grunt-dss) and a [Gulp Plugin](http://github.com/dsswg/gulp-dss).

### Examples

##### Example Comment Block Format


```scss
//
// @name Button
// @description Your standard form button.
// 
// @state :hover - Highlights when hovering.
// @state :disabled - Dims the button when disabled.
// @state .primary - Indicates button is the primary action.
// @state .smaller - A smaller button
// 
// @markup
//   <button>This is a button</button>
// 
````

##### Example Usage

```javascript
// Requirements
const fs = require('fs')
const { parse } = require('@documented-style-sheets/parser')

// Get file contents
const fileContents = fs.readFileSync('styles.css')

// Run the DSS Parser on the file contents
parse(fileContents, {}, function (parsedObject) {
  // Output the parsed document
  console.log(parsedObject)
})
````

##### Example Output

```json
{
  "name": "Button",
  "description": "Your standard form button.",
  "state": [
    { 
      "name": ":hover",
      "escaped": "pseudo-class-hover",
      "description": "Highlights when hovering."
    },
    {
      "name": ":disabled",
      "escaped": "pseudo-class-disabled",
      "description": "Dims the button when disabled."
    },
    {
      "name": ".primary",
      "escaped": "primary",
      "description": "Indicates button is the primary action."
    },
    {
      "name": ".smaller",
      "escaped": "smaller",
      "description": "A smaller button"
    }
  ],
  "markup": {
    "example": "<button>This is a button</button>",
    "escaped": "&lt;button&gt;This is a button&lt;/button&gt;"
  }
}
````
#### dss.detector(\<callback\>)

This method defines the way in which points of interest (ie. variables) are found in lines of text and then, later, parsed. **DSS** dogfoods this API and the default implementation is shown below.

###### Default Detector:

```javascript
// Describe default detection pattern
// Note: the current line, as a string, is passed to this function
const dss = require('@documented-style-sheets/parser')
dss.detector(function(line) {
  if (typeof line !== 'string') {
    return false
  }
  var reference = line.split("\n\n").pop()
  return !!reference.match(/.*@/)
})

dss.parse(...)
````

#### dss.parser(\<name\>, \<callback\>)

**DSS**, by default, includes 4 parsers for the `name`, `description`, `state` and `markup` of a comment block. You can add to, or override, these defaults by registering a new parser. These defaults also follow a pattern which uses the `@` decorator to identify them. You can modify this behaivour providing a different callback function to `dss.detector()`.

`dss.parser` expects the name of the variable you're looking for and a callback function to manipulate the contents. Whatever is returned by that callback function is what is used in generate JSON.

##### Callback `this`:

- `this.file`: The current file
- `this.name`: The name of the parser
- `this.options`: The options that were passed to `dss.parse()` initially
- `this.line`:
  - `this.line.contents`: The content associated with this variable
  - `this.line.from`: The line number where this variable was found
  - `this.line.to`: The line number where this variable's contents ended
- `this.block`:
  - `this.block.contents`: The content associated with this variable's comment block
  - `this.block.from`: The line number where this variable's comment block starts
  - `this.block.to`: The line number where this variable's comment block ends
  
    
##### Custom Parser Examples:

```javascript
// Matches @version
dss.parser('version', function () {
  // Just returns the lines contents
  return this.line.contents
})
````

```javascript
dss.parser('link', function () {
  // Replace link with HTML wrapped version
  const exp = /(b(https?|ftp|file)://[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig
  this.line.contents.replace(exp, "<a href='$1'>$1</a>")
  return line
})
````

### Other Projects
- [Grunt Plugin](http://github.com/dsswg/grunt-dss)
- [Gulp Plugin](http://github.com/dsswg/gulp-dss)
- [Sublime Text Plugin](https://github.com/sc8696/sublime-css-auto-comments)
- [UX Recorder](http://github.com/dsswg/dss-recorder)
- [UX Player](http://github.com/dsswg/dss-player)
- [SourceJS Plugin](https://github.com/sourcejs/sourcejs-contrib-dss)
