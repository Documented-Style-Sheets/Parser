![](http://f.cl.ly/items/1J353X3U172A1u3r2K3b/dss-logo.png)

DSS
===

**@version 1.0**

**DSS**, Documented Style Sheets, is a [Grunt](http://gruntjs.com) plugin that exposes a [KSS](https://github.com/kneath/kss) style of comment blocking and parser of CSS, LESS, SASS and SCSS code for UI documentation generation.

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

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install DSS --save-dev
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

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
      // Task-specific options go here.
    }
  },
})
```

### Options

#### options.template
Type: `String`
Default value: `/template/`

A relative path to a `mustache` template to be used instead of the default

#### options.output
Type: `String`
Default value: `/docs/`

A relative path to a the directory you'd like to generate the documentation

#### options.parsers
Type: `Object`
Default value: `{}`

An object filled with key value pairs of functions to be used when parsing comment blocks. See the **example** below for more context about how to use these.


### Exmaple initConfig

```javascript
grunt.initConfig({
  DSS: {
    options: {
      location: __dirname + '/css/',
      output: __dirname + '/api/'
      parsers: {
        // Finds @link in comment blocks
        link: function(i, line, block){

          // Replace link with HTML wrapped version
          var exp = /(b(https?|ftp|file)://[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
          line.replace(exp, "<a href='$1'>$1</a>");
          return line;
        }
      }
    }
  }
});
````
