process.env.NODE_ENV = 'test';
var path        = require('path');
var assert      = require('assert');

var cofs = require(path.join(__dirname, '..', 'cofs.lara.state.mi.us'));
var parsers = require(path.join(__dirname, '..', 'cofs.lara.state.mi.us', 'parsers'));

describe('Michigan', () => {
  describe('Services', () => {
    describe('cofs.lara.state.mi.us', () => {
      
      it('entity', (done) => {
	var options = {cache: true, meta: true};
	cofs.entities('crosby', options).then((list) => {
	  //console.log(list);
	  //assert.equal(list.data[0].entity_name, 'RYAN, L.L.C.')
	  done();
	}).catch(console.log);

      });

      it('entity:page:2 (the next cursor)', (done) => {
	var options = {cache: true, meta: true};
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
	  //console.log(list);
	  assert.equal(list.meta.total_records, list.meta.next_cursor.EndRange)
	  done();
	}).catch(console.log);

      });



      it('individual', (done) => {
	var options = {cache: true, meta: true};
	cofs.individuals('crosby', options).then((list) => {
	  //console.log(list);

	  assert.equal(list.data[0].entity_name, '1103 13TH STREET, LLC')
	  done();
	}).catch(console.log);

      });

      it('byId', (done) => {
	
	var data = {
	  SearchValue: '801872402', 
	  SearchMethod: 'B'
	};

	var options = {cache: true, hidden: false};
	cofs.byId(data.SearchValue, options).then((data) => {
	  assert.equal(data.resident_agent.name, 'THE CORPORATION COMPANY');
	  assert.equal(data.id, '801872402')
	  //console.log(data);
	  done();
	}).catch(console.log);
      });

      it('byId KOBAYASHI', (done) => {
	
	var data = {
	  SearchValue: '800956413', 
	  SearchMethod: 'B'
	};

	var options = {cache: true};
	cofs.byId(data.SearchValue, options).then((data) => {
	  assert.equal(data.id, '800956413')
          //console.log(data);
	  done();
	}).catch(console.log);
      });

      it('byId ACCEPTANCE', (done) => {
	
	var data = {
	  SearchValue: '801006468', 
	  SearchMethod: 'B'
	};

	var options = {cache: true};
	cofs.byId(data.SearchValue, options).then((data) => {
	  assert.equal(data.id, '801006468')
	  assert.equal(data.resident_agent.name, 'THE CORPORATION COMPANY');
	  done();
	}).catch(console.log);
      });

      it('byId LLC', (done) => {
	
	var data = {
	  SearchValue: '801869963', 
	  SearchMethod: 'B'
	};

	var options = {cache: true};
	cofs.byId(data.SearchValue, options).then((data) => {
	  assert.equal(data.id, '801869963')
	  assert.equal(data.resident_agent.name, 'CSC-LAWYERS INCORPORATING SERVICE (COMPANY)');
	  
	  //console.log(data);
	  done();
	}).catch(console.log);
      });

      it('byId LLC', (done) => {
	
	var data = {
	  SearchValue: '802691192', 
	  SearchMethod: 'B'
	};

	var options = {cache: true};
	cofs.byId(data.SearchValue, options).then((data) => {
	  assert.equal(data.id, '802691192')
	  //assert.equal(data.resident_agent.name, 'CSC-LAWYERS INCORPORATING SERVICE (COMPANY)');
	  
	  //console.log(data);
	  done();
	}).catch(console.log);
      });


    });
  });
});
