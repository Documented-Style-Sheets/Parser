/* global define self */

// Global Scope
const root = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) || this

// DSS Object
const dss = (function () {
  // Store reference
  const _dss = function () {}

  // Store parsers
  _dss.parsers = {}

  // Default detect function
  _dss.detect = function () {
    return true
  }

  /*
   * Modify detector method
   *
   * @param (Function) The callback to be used to detect variables
   */
  _dss.detector = function (fn) {
    _dss.detect = fn
  }

  /*
   * Add a parser for a specific variable
   *
   * @param (String) The name of the variable
   * @param (Function) The callback to be executed at parse time
   */
  _dss.parser = function (name, fn) {
    _dss.parsers[name] = fn
  }

  /*
   * Add an alias for a parser
   *
   * @param (String) The name of the new variable
   * @param (String) The name of the existing parser to use
   */
  _dss.alias = function (newName, oldName) {
    _dss.parsers[newName] = _dss.parsers[oldName]
  }

  /*
   * Trim whitespace from string
   *
   * @param (String) The string to be trimmed
   * @return (String) The trimmed string
   */
  _dss.trim = function (str, arr) {
    const defaults = [/^\s\s*/, /\s\s*$/]
    arr = (_dss.isArray(arr)) ? arr.concat(defaults) : defaults
    arr.forEach(function (regEx) {
      str = str.replace(regEx, '')
    })
    return str
  }

  /*
   * Check if object is an array
   *
   * @param (Object) The object to check
   * @return (Boolean) The result of the test
   */
  _dss.isArray = function (obj) {
    return toString.call(obj) === '[object Array]'
  }

  /*
   * Check the size of an object
   *
   * @param (Object) The object to check
   * @return (Boolean) The result of the test
   */
  _dss.size = function (obj) {
    let size = 0
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) { size++ }
    }
    return size
  }

  /*
   * Iterate over an object
   *
   * @param (Object) The object to iterate over
   * @param (Function) Callback function to use when iterating
   * @param (Object) Optional context to pass to iterator
   */
  _dss.each = function (obj, iterator, context) {
    if (obj == null) {
      return
    }
    if (obj.length === +obj.length) {
      for (let i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === {}) {
          return
        }
      }
    } else {
      for (const key in obj) {
        if (Object.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === {}) {
            return
          }
        }
      }
    }
  }

  /*
   * Extend an object
   *
   * @param (Object) The object to extend
   */
  _dss.extend = function (obj) {
    _dss.each(Array.prototype.slice.call(arguments, 1), function (source) {
      if (source) {
        for (const prop in source) {
          obj[prop] = source[prop]
        }
      }
    })
    return obj
  }

  /*
   * Squeeze unnecessary extra characters/string
   *
   * @param (String) The string to be squeeze
   * @param (String) The string to be matched
   * @return (String) The modified string
   */
  _dss.squeeze = function (str, def) {
    return str.replace(/\s{2,}/g, def)
  }

  /*
   * Normalizes the comment block to ignore any consistent preceding
   * whitespace. Consistent means the same amount of whitespace on every line
   * of the comment block. Also strips any whitespace at the start and end of
   * the whole block.
   *
   * @param (String) Text block
   * @return (String) A cleaned up text block
   */
  _dss.normalize = function (textBlock) {
    // Strip out any preceding [whitespace]* that occurs on every line
    return _dss.trim(textBlock.replace(/^(\s*\*+)/, ''))
  }

  /*
   * Takes a file and extracts comments from it.
   *
   * @param (Object) options
   * @param (Function) fn
   */
  _dss.parse = function (lines, options, fn) {
    // Options
    options = (options) || {}
    options.preserve_whitespace = !!(options.preserve_whitespace)

    // Setup
    let currentBlock = ''
    let insideSingleLineBlock = false
    let insideMultiLineBlock = false
    const _blocks = []
    let parsed = ''
    const blocks = []
    let temp = {}
    let lineNum = 0
    let from = 0

    lines = lines + ''
    lines.split(/\n/).forEach(function (line) {
      // Iterate line number and ensure line is treaty as a string
      lineNum = lineNum + 1
      line = line + ''

      // Store starting line number
      if (singleLineComment(line) || startMultiLineComment(line)) {
        from = lineNum
      }

      // Parse Single line comment
      if (singleLineComment(line)) {
        parsed = parseSingleLine(line)
        if (insideSingleLineBlock) {
          currentBlock += '\n' + parsed
        } else {
          currentBlock = parsed
          insideSingleLineBlock = true
        }
      }

      // Parse multi-line comments
      if (startMultiLineComment(line) || insideMultiLineBlock) {
        parsed = parseMultiLine(line)
        if (insideMultiLineBlock) {
          currentBlock += '\n' + parsed
        } else {
          currentBlock += parsed
          insideMultiLineBlock = true
        }
      }

      // End a multi-line block
      if (endMultiLineComment(line)) {
        insideMultiLineBlock = false
      }

      // Store current block if done
      if (!singleLineComment(line) && !insideMultiLineBlock) {
        if (currentBlock) {
          _blocks.push({ text: _dss.normalize(currentBlock), from, to: lineNum })
        }
        insideSingleLineBlock = false
        currentBlock = ''
      }
    })

    // Create new blocks with custom parsing
    _blocks.forEach(function (block) {
      // Store line numbers
      const from = block.from
      const to = block.to

      // Remove extra whitespace
      block = block.text.split('\n').filter(function (line) {
        return (_dss.trim(_dss.normalize(line)))
      }).join('\n')

      // Split block into lines
      block.split('\n').forEach(function (line) {
        if (_dss.detect(line)) {
          temp = parser(temp, _dss.normalize(line), block, lines, from, to, options)
        }
      })

      // Push to blocks if object isn't empty
      if (_dss.size(temp)) {
        blocks.push(temp)
      }
      temp = {}
    })

    // Execute callback with filename and blocks
    fn({ blocks })
  }

  /*
   * Parses line
   *
   * @param (Num) the line number
   * @param (Num) number of lines
   * @param (String) line to parse/check
   * @return (Boolean) result of parsing
   */
  function parser (temp, line, block, file, from, to, options) {
    const parts = line.replace(/.*@/, '')
    const index = indexer(parts, ' ') || indexer(parts, '\n') || indexer(parts, '\r') || parts.length
    const name = _dss.trim(parts.substr(0, index))
    const output = {
      options,
      file,
      name,
      line: {
        contents: _dss.trim(parts.substr(index)),
        from: block.indexOf(line),
        to: block.indexOf(line)
      },
      block: {
        contents: block,
        from,
        to
      }
    }

    // find the next instance of a parser (if there is one based on the @ symbol)
    // in order to isolate the current multi-line parser
    const nextParserIndex = block.indexOf('* @', output.line.from + 1)
    const markupLength = (nextParserIndex > -1) ? nextParserIndex - output.line.from : block.length
    let contents = block.split('').splice(output.line.from, markupLength).join('')
    const parserMarker = '@' + name
    contents = contents.replace(parserMarker, '')

    // Redefine output contents to support multiline contents
    output.line.contents = (function (contents) {
      const ret = []
      const lines = contents.split('\n')

      lines.forEach(function (line, i) {
        const pattern = '*'
        const index = line.indexOf(pattern)

        if (index >= 0 && index < 10) {
          line = line.split('').splice((index + pattern.length), line.length).join('')
        }

        // Trim whitespace from the the first line in multiline contents
        if (i === 0) {
          line = _dss.trim(line)
        }

        if (line && line.indexOf(parserMarker) === -1) {
          ret.push(line)
        }
      })

      return ret.join('\n')
    })(contents)

    line = {}
    line[name] = (_dss.parsers[name]) ? _dss.parsers[name].call(output) : output.line.contents

    if (temp[name]) {
      if (!_dss.isArray(temp[name])) {
        temp[name] = [temp[name]]
      }
      if (!_dss.isArray(line[name])) {
        temp[name].push(line[name])
      } else {
        temp[name].push(line[name][0])
      }
    } else {
      temp = _dss.extend(temp, line)
    }
    return temp
  };

  /*
   * Get the index of string inside of another
   */
  function indexer (str, find) {
    return (str.indexOf(find) > 0) ? str.indexOf(find) : false
  };

  /*
   * Check for single-line comment
   *
   * @param (String) line to parse/check
   * @return (Boolean) result of check
   */
  function singleLineComment (line) {
    return !!line.match(/^\s*\/\//)
  };

  /*
   * Checks for start of a multi-line comment
   *
   * @param (String) line to parse/check
   * @return (Boolean) result of check
   */
  function startMultiLineComment (line) {
    return !!line.match(/^\s*\/\*/)
  };

  /*
   * Check for end of a multi-line comment
   *
   * @parse (String) line to parse/check
   * @return (Boolean) result of check
   */
  function endMultiLineComment (line) {
    if (singleLineComment(line)) {
      return false
    }
    return !!line.match(/.*\*\//)
  };

  /*
   * Removes comment identifiers for single-line comments.
   *
   * @param (String) line to parse/check
   * @return (Boolean) result of check
   */
  function parseSingleLine (line) {
    return line.replace(/\s*\/\//, '')
  };

  /*
   * Remove comment identifiers for multi-line comments.
   *
   * @param (String) line to parse/check
   * @return (Boolean) result of check
   */
  function parseMultiLine (line) {
    const cleaned = line.replace(/\s*\/\*/, '')
    return cleaned.replace(/\*\//, '')
  };

  // Return function
  return _dss
})()

// Describe default detection pattern
dss.detector(function (line) {
  if (typeof line !== 'string') {
    return false
  }
  const reference = line.split('\n\n').pop()
  return !!reference.match(/.*@/)
})

// Describe default parsing of a name
dss.parser('name', function () {
  return this.line.contents
})

// Describe default parsing of a description
dss.parser('description', function () {
  return this.line.contents
})

// Describe default parsing of a state
dss.parser('state', function () {
  const state = this.line.contents.split(' - ')
  return [{
    name: (state[0]) ? dss.trim(state[0]) : '',
    escaped: (state[0]) ? dss.trim(state[0].replace('.', ' ').replace(':', ' pseudo-class-')) : '',
    description: (state[1]) ? dss.trim(state[1]) : ''
  }]
})

// Describe default parsing of a piece markup
dss.parser('markup', function () {
  return [{
    example: this.line.contents,
    escaped: this.line.contents.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }]
})

// Module exports
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = dss
  }
  exports.dss = dss
} else {
  root.dss = dss
}

// AMD definition
if (typeof define === 'function' && define.amd) {
  define(function (require) {
    return dss
  })
}
