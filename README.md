<<<<<<< HEAD
DSS
=======
![DSS](http://f.cl.ly/items/1J353X3U172A1u3r2K3b/dss-logo.png)

DSS [![Build Status](https://secure.travis-ci.org/darcyclarke/DSS.png?branch=master)](http://travis-ci.org/darcyclarke/DSS)
>>>>>>> 308468da85e1653f268dd51ea53e2e3b7101e3f7
===

**@version 1.0**
**@logo [DSS](http://f.cl.ly/items/1J353X3U172A1u3r2K3b/dss-logo.png)**

**DSS**, Documented Style Sheets, is a [Grunt](http://gruntjs.com) plugin that exposes a [KSS](https://github.com/kneath/kss) style of comment blocking and parser of CSS, LESS, STYLUS, SASS and SCSS code for UI documentation generation.

### Example Comment Block

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

### Example Generated Object

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

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install DSS --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('DSS');
```

## The "DSS" task

### Overview
In your project's Gruntfile, add a section named `DSS` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  DSS: {
    options: {
      // commons options go here.
    }
    docs: {
      options: {
        // Task-specific options go here.
      },
      files: {
        'dest/': 'source/**/*'
      }
    }
  },
})
```

### Options

#### options.template
Type: `String`
Default value: `{task_path}/template/`

A relative path to a `mustache` template to be used instead of the default

#### options.parsers
Type: `Object`
Default value: `{}`

An object filled with key value pairs of functions to be used when parsing comment blocks. See the **example** below for more context about how to use these.


### Example initConfig

```javascript
grunt.initConfig({
  DSS: {
    docs: {
      options: {
        parsers: {
          // Finds @link in comment blocks
          link: function(i, line, block){

            // Replace link with HTML wrapped version
            var exp = /(b(https?|ftp|file)://[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
            line.replace(exp, "<a href='$1'>$1</a>");
            return line;
          }
        }
      },
      files: {
        'api/': 'css/**/*.{css,scss,sass,less,styl}'
      }
    }
  }
});
````
