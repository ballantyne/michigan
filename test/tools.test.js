process.env.NODE_ENV = 'test';
var path   = require('path');
var assert = require('assert');


var {
  constructOptions,
  requireJSON
} = require(path.join(__dirname, '..', 'tools'));


describe('Michigan', () => {
  describe('tools', () => {
    describe('applyOptions', () => {

      it('get', (done) => {
	var applyOptions = constructOptions(requireJSON(path.join(__dirname, '..', 'cofs.lara.state.mi.us', 'defaults')))
	var options = applyOptions('default', 'get', {});

	assert.notEqual(options.headers['Content-Type'], 'application/x-www-form-urlencoded; charset=UTF-8');
        assert.equal(options.method, 'GET')
        assert.equal(options.hostname, 'cofs.lara.state.mi.us')
	assert.equal(options.headers.Host, 'cofs.lara.state.mi.us')
        assert.equal(options.headers.Origin, 'https://cofs.lara.state.mi.us')

	done();
      });

    });
  });
});


