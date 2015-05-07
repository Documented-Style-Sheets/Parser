var dss = require('../dss');
var fs = require('fs');
var path = require('path');

exports.testParse = function(test){
  test.expect(2);

  var fileContents = fs.readFileSync(path.join(__dirname, 'data/button.css'), 'utf8');
  dss.parse(fileContents, {}, function(parsed) {
    var block = parsed.blocks[0];
    test.equal(block.name, 'Button');
    test.equal(block.description, 'Your standard form button.');
    test.done();
  });
};
