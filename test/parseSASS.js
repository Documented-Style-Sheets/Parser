// Require
var fs    = require( 'fs' );
var path  = require( 'path' );
var dss   = require( '../dss' );

// Basic Parsing Stylus
exports.parseSASS= function ( test ) {

  test.expect( 2 );

  var fileContents = fs.readFileSync( path.join( __dirname, 'data/parse.sass' ), 'utf8' );

  dss.parse( fileContents, {}, function( parsed ) {
    console.log( parsed );
    var block = parsed.blocks[ 0 ];
    test.equal( block.name, 'Button' );
    test.equal( block.description, 'Your standard form button.' );
    test.done();

  });
};