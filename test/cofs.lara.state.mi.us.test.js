process.env.NODE_ENV = 'test';

var path        = require('path');
var assert      = require('assert');

var cofs = require(path.join(__dirname, '..', 'cofs.lara.state.mi.us'));
var parsers = require(path.join(__dirname, '..', 'cofs.lara.state.mi.us', 'parsers'));

//console.log(cofs);

describe('Michigan', () => {
  describe('Services', () => {
    describe('cofs.lara.state.mi.us', () => {

      it('entity', (done) => {
	var options = {cache: true, meta: true, ttl: 300000};
	cofs.entities('ryan llc', options).then((list) => {
	  assert.equal(list.data[0].entity_name, 'RYAN, L.L.C.')
	  done();
	}).catch(console.log);
      });

      it('entity:page:2 (the next cursor)', (done) => {
	var options = {cache: true, meta: true, ttl: 300000};
	var query = {
	  SearchValue: 'crosby',
	  SortColumn: '',
	  SortDirection: '',
	  SearchType: 'E',
	  SearchMethod: 'B',
	  StartRange: 26,
	  EndRange: 50
	}

	cofs.entities(query, options).then((list) => {
	  assert.equal(list.meta.total_records, list.meta.next_cursor.EndRange)
	  // console.log(list);
	  done();
	}).catch(console.log);
      });

      it('individual', (done) => {
	var options = {cache: true, meta: true, ttl: 300000};

	cofs.individuals('crosby', options).then((list) => {
	  assert.equal(list.data[0].entity_name, '1103 13TH STREET, LLC')
	  done();
	}).catch(console.log);
      });

      it('find', (done) => {
	var options = {cache: true, hidden: false, ttl: 300000};

	cofs.find("801872402", options).then((data) => {
	  assert.equal(data.resident_agent.name, 'THE CORPORATION COMPANY');
	  assert.equal(data.id, '801872402')
	  done();
	}).catch(console.log);
      });

      it('find KOBAYASHI', (done) => {
	var options = {cache: true, ttl: 300000};
	cofs.find('800956413', options).then((data) => {
	  assert.equal(data.id, '800956413')
	  done();
	}).catch(console.log);
      });

      it('find ACCEPTANCE', (done) => {
	var options = {cache: true, ttl: 300000};
	cofs.find("801006468", options).then((data) => {
	  assert.equal(data.id, '801006468')
	  assert.equal(data.resident_agent.name, 'THE CORPORATION COMPANY');
	  done();
	}).catch(console.log);
      });

      it('find LLC', (done) => {
	var options = {cache: true, ttl: 300000};
	cofs.find("801869963", options).then((data) => {
	  assert.equal(data.id, '801869963')
	  assert.equal(data.resident_agent.name, 'CSC-LAWYERS INCORPORATING SERVICE (COMPANY)');
	  done();
	}).catch(console.log);
      });

      it('find LLC', (done) => {
	var options = {cache: true, ttl: 300000};
	cofs.find("802691192", options).then((data) => {
	  //console.log(data);
	  assert.equal(data.id, '802691192')
	  //assert.equal(data.resident_agent.name, 'CSC-LAWYERS INCORPORATING SERVICE (COMPANY)');
	  done();
	}).catch(console.log);
      });

      it('find error message', (done) => {
	var options = {cache: true, ttl: 300000, meta: true, response: true};
	cofs.find("1", options).then((data) => {
	  assert.equal(data.error, 'There was an error with your request')
	  done();
	}).catch(console.log);
      });


      xit('filings', (done) => {
	var id = '802691192';

	var options = {cache: true};
	cofs.filings(id, options).then((data) => {
	  done();
	}).catch(console.log);
      });

    });
  });
});


