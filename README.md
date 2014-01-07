# DSS
- **[Official Logo](http://f.cl.ly/items/1J353X3U172A1u3r2K3b/dss-logo.png)**
- **[NPM Package](https://npmjs.org/package/dss)**

**DSS**, Documented Style Sheets, is a comment styleguide and parser for CSS, LESS, STYLUS, SASS and SCSS code.

## Generating Documentation

In most cases, you will want to include the **DSS** parser in a build step that will generate documentation files automatically. **[grunt-dss](https://github.com/darcyclarke/grunt-dss)** is the official **DSS** `grunt` task which does just that.

## Parser Example

#### Example Comment Block

```css
/**
  * @name Button
  * @description Your standard form button.
  * 
  * @state :hover - Highlights when hovering.
  * @state :disabled - Dims the button when disabled.
  * @state .primary - Indicates button is the primary action.
  * @state .smaller - A smaller button
  * 
  * @markup
  *   <button>This is a button</button>
  */ 
````
#### or

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

#### Example Parser Implementation

```javscript
var lines = fs.readFileSync('styles.css'),
    options = {},
    callback = function(parsed){
      console.log(parsed);
    };
dss.parse(lines, options, callback);
````

#### Example Generated Object

```javascript
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

## Modifying Parsers

**DSS**, by default, includes 4 parsers for the **name**, **description**, **states** and **markup** of a comment block. You can add to or override these default parsers using the following:

```javascript
// Matches @link
dss.parser('link', function(i, line, block){

  // Replace link with HTML wrapped version
  var exp = /(b(https?|ftp|file)://[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
  line.replace(exp, "<a href='$1'>$1</a>");
  return line;
   
});
````

## DSS Sublime Text Plugin

You can now **auto-complete** DSS-style comment blocks using @sc8696's [Auto-Comments Sublime Text Plugin](https://github.com/sc8696/sublime-css-auto-comments)


