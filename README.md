# DSS
**@version 1.0**
**@logo [DSS](http://f.cl.ly/items/1J353X3U172A1u3r2K3b/dss-logo.png)**

**DSS**, Documented Style Sheets, is a parser and style guide that creates  UI documentation objects from properly commented CSS, LESS, STYLUS, SASS and SCSS files.

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
