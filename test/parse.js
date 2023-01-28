const dss = require('..')
const fs = require('fs')
const path = require('path')
const tap = require('tap')

const fileContents = fs.readFileSync(path.join(__dirname, 'data/button.css'), 'utf8')

dss.parse(fileContents, {}, function (parsed) {

  const block = parsed.blocks[0]
  
  tap.equal(block.name, 'Button')
  tap.equal(block.description, 'Your standard form button.')

  tap.equal(block.state.length, 2)
  tap.equal(block.state[0].name, ':hover')
  tap.equal(block.state[0].description, 'Highlights when hovering.')

  tap.equal(block.state[1].name, '.smaller')
  tap.equal(block.state[1].description, 'A smaller button')

  tap.equal(block.custom, 'Some custom info')

  tap.equal(block.markup.length, 1)
  tap.equal(block.markup[0].example.trim(), '<button>This is a button</button>')
  tap.equal(block.markup[0].escaped.trim(), '&lt;button&gt;This is a button&lt;/button&gt;')

})