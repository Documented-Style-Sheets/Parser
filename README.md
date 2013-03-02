DSS
===

**@version 1.0**

**DSS**, Documented Style Sheets, is a [Grunt](http://grunt.js.com) plugin that exposes a [KSS](https://github.com/kneath/kss) style of comment blocking and parser of CSS, LESS, SASS and SCSS code for UI documentation generation. 

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
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

#### options.template
Type: `String`
Default value: `default`

A relative path to a `mustache` template to be used instead of the default
