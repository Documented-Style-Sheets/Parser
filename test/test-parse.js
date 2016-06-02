var dss = require('../dss');
var fs = require('fs');
var path = require('path');

exports.testParse = function(test){
  test.expect(9);

  var fileContents = fs.readFileSync(path.join(__dirname, 'data/button.css'), 'utf8');
  dss.parse(fileContents, {}, function(parsed) {
    var block = parsed.blocks[0];
    test.equal(block.name, 'Button');
    test.equal(block.description, 'Your standard form button.');

    test.equal(block.state.length, 2);
    test.equal(block.state[0].name, ':hover');
    test.equal(block.state[0].description, 'Highlights when hovering.');

    test.equal(block.state[1].name, '.smaller');
    test.equal(block.state[1].description, 'A smaller button');

    test.equal(block.markup.example.trim(), '<button>This is a button</button>');
    test.equal(block.markup.escaped.trim(), '&lt;button&gt;This is a button&lt;/button&gt;');
    test.done();
  });
};
