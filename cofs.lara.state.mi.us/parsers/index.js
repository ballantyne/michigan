
const path = require('path');
const { createHmac } = require('node:crypto');
const sortKeysRecursive = require('sort-keys-recursive');

const { 
  newCursor, 
  modulatorize, 
  extraction,
  extractor, 
  fingerprint, 
  ignoramous,
  copyObj, 
  merge, 
  requireJSON,
  constructOptions 
} = require(path.join(__dirname, '..', 'tools'));





var search = function(html, config={}, meta={}) {
 
  if (config.meta) {
    Object.assign(meta, {version: {cache: fingerprint('list', html)}});
  }

  var fields = {
    id_number: 'id_number'
  }
  
  var ignoranceRules = requireJSON(path.join(__dirname, 'search', 'ignore'));
  var ignorance = ignoramous(ignoranceRules);
  var transitions = requireJSON(path.join(__dirname, 'search', 'transitions'));
  var modulator = modulatorize(transitions);
  var context = {state: 'scan', parser: 'none', headers: []};

  //config.verbose = true;

  return new Promise((resolve) => {
    var rows = html.split("\n").reduce((obj, raw, index) => {

      var line = raw.trim();
 
      if (ignorance(line, ignoranceRules)) {
	line = line.replace('<td>', '').replace('</td>', '').trim();

        var modulations = modulator(context.state, line, transitions);

	if (config.verbose) {
	  console.log('');
	  console.log('------------------------------------------------------')
	  console.log(line);
	  console.log('state:',context.state);

          if (modulations.length > 0) {
	    console.log('.......................................................')
	    console.log('modulations');
	    console.log('.......................................................')
	    console.log(modulations);
	  }
	}

	var changes = modulations.filter((modulation) => { 
	  return Object.keys(modulation).indexOf('sets') > -1
	});

	var actions = modulations.filter((modulation) => { 
	  return Object.keys(modulation).indexOf('action') > -1
	});
	
	while(changes.length > 0) {
	  var change = changes.shift();
	  Object.assign(context, copyObj(change.sets));
	}

	while(actions.length > 0) {
	  var modulation = actions.shift();
	  
	  switch(modulation.action) {
	    case 'total_pages':
	      var matched = line.match(/<label id="TotalPages">Number of Pages: (?<total_pages>.+)</)
	      meta.total_pages = parseInt(matched.groups.total_pages.replace(',', ''));

	      break;
	
	    case 'total_records':
	      var matched = line.match(/<label id="TotalRecords">Number of Records: (?<total_records>.+)</);
	      meta.total_records = parseInt(matched.groups.total_records.replace(',', ''));

	      break;
	
	    case 'newRecord':
	      // this code manages when to push the current record onto the list
	      if (obj.current != undefined && Object.keys(obj.current).length > 0) {
		obj.list.push(obj.current);
	      }
	      obj.current = {type: context.parser};
	      obj.sequence = copyObj(context.headers);
	      break;
	    
	    case 'headers:push':
	      // this code accumulates the header values prior to parsing the list

	      function adjustName(name) {
                return name.replace('_number', '');
	      }

	      var matched = line.match(/\>(.+)\</);
	      var header = matched[1];
	      header = header.toLowerCase().replace(/[.,'\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(' ').join('_')
	      
	      if (header == 'entity_name') {
		context.headers.push('url')
	      }
	      context.headers.push(adjustName(header));
	      break;
	    
	    default:
	      console.log('unexecuted action', modulation);
	      break;
	  }

	}


	var isntANewRecord = modulations.map((modulation) => { 
	  return modulation.action == 'newRecord';
	}).length == 0;

	if (context.state == 'collect' && isntANewRecord) {
	  var name = obj.sequence.shift();

	  // there has got to be a better way to organize this so it 
	  // doesn't repeat so much code, but the names come from the 
	  // page that is served.

	 
	  switch(name) {
            case 'individuals_address':
	      var address = extraction.address(line)
	      obj.current.address = address
	      break;
	    case 'address':
	      var address = extraction.address(line)
	      obj.current.address = address;
	      break;
	    case 'url':
	      var matched = line.match(/href="(?<url>.+)"\s/);
	      Object.assign(obj.current, matched.groups);
	      break;
	    default: 
	      obj.current[name] = (line.length == 0 ? null : line);
	      break;
	  }
	}

      }


      return obj
    }, {list: [], headers: []})

    rows.list = rows.list.filter((entity) => { 
      return entity.type == (meta.params.SearchType == 'E' ? 'entity' : 'individual');
    }).map((entity) => { 
      delete entity.type;
      return entity;
    })


    if (config.meta) {
      meta.version.data = fingerprint('list', rows.list);
      meta.requested_at = new Date();

      // this logic needs to be checked for errors, it shouldn't 
      // automatically increment above the total records amount.  
      // it shouldn't add a cursor if there isn't another page.
      
      Object.assign(meta, newCursor(meta));


      var results = {meta: meta, data: rows.list};
    } else {
      var results = rows.list
    }


    resolve(results);
  }) 
}

module.exports.search = search;






var entity = function(html, config={}, meta={}) {

  if (config.meta) {
    Object.assign(meta, {cache: fingerprint('entity', html)});
  }

  var ignoranceRules = requireJSON(path.join(__dirname, 'entity', 'ignore'));
  var ignorance = ignoramous(ignoranceRules);
 
  var transitions = requireJSON(path.join(__dirname, 'entity','transitions'));
  var modulator = modulatorize(transitions);

  var context = {state: 'scan', parser: 'none', headers: []};

  // ActsSubjectTo not supported currently
  var fields = {
    Purpose: 'purpose',
    ActsFormedUnder: 'acts_formed_under',
    MostRecentAnnualReportWithOfficersAndDirectors: 'most_recent_actual_annual_report',
    Sum: 'total_authorized_shares',
    ResidentZip: 'resident_zip',
    ResidentState: 'resident_state',
    ResidentCity: 'resident_city',
    ResidentStreet: 'resident_street',
    aptsuiteother: 'resident_suite',
    ResidentAgentName: 'resident_agent_name',
    PrincipleStreet: 'office_street',
    aptsuiteotherlblpricipal: 'office_suite',
    PrincipleCity: 'office_city',
    PrincipleState: 'office_state',
    PrincipleZip: 'office_zip',
    Term: 'term',
    Jurisdiction: 'jurisdiction',
    OrganisationDate: 'organization_date',
    EntityType: 'entity_type',
    ForeignName: 'foreign_name',
    EntityName: 'entity_name',
    EntityNameHeader: 'name',
    IDNumber: 'id',
    OldIDNumber: 'old_id'
  }

  // config.verbose = true;

  var filings = [];
  var officers = [];
  var hidden = {};

  return new Promise((resolve) => {
    var entity = html.split("\n").reduce((obj, raw, index) => {

      var line = raw.trim();

      if (ignorance(line, ignoranceRules)) {
        //console.log('processing', raw);


	line = line.replace('<td>', '').replace('</td>', '').trim();

        var modulations = modulator(context.state, line, transitions);

	if (config.verbose) {
	  console.log('');
	  console.log('------------------------------------------------------')
	  console.log(line);
	  console.log('raw:', raw);
	  console.log('state:',context.state);
	  console.log('#:',index);
          console.log('')
          if (modulations.length > 0) {
	    console.log('.......................................................')
	    console.log('modulations');
	    console.log('.......................................................')
	    console.log(modulations);
	    console.log('');
	  }
	}

	var changes = modulations.filter((modulation) => { 
	  return Object.keys(modulation).indexOf('sets') > -1
	});

	var actions = modulations.filter((modulation) => { 
	  return Object.keys(modulation).indexOf('action') > -1
	});
	
	while(changes.length > 0) {
	  var change = changes.shift();
	  Object.assign(context, copyObj(change.sets));
	}

	while(actions.length > 0) {
	  var modulation = actions.shift();
	  
	  switch(modulation.action) {
	    case 'capture:officer':
              var regex = />(?<position>.+)<.+>(?<name>.+)<\/td><td valign="top">(?<street>.+)\s\s(?<city>.+),(?<state>.+)\s(?<zip>.+)\s(?<country>.+)<\/td>/
	      var matched = line.match(regex);
	      var officer = {
                name: matched.groups.name,
		position: matched.groups.position,
		address: {
                  street: matched.groups.street,
		  city: matched.groups.city,
		  state: matched.groups.state,
		  zip: matched.groups.zip,
		  country: matched.groups.country
		}
	      }
	      officers.push(officer);
	      
	      break;

	    case 'collect:filings':
              var regex = /<option.+value="(?<id>.+)">(?<name>.+)<\/option>/
	      var matched = line.match(regex);
	      filings.push(copyObj(matched.groups));
	      
	      break;

	    case 'token':
	      var regex = /.+CorpSummary.aspx\?token=(?<token>.[^"]+)/
	      var matched = line.match(regex);
	      Object.assign(hidden, matched.groups);
	      
	      break;
	    
	    case 'viewstate:generator':
	      var regex = /__VIEWSTATEGENERATOR" value="(?<generator>.+)" \/>/
	      var matched = line.match(regex);
	      Object.assign(hidden, matched.groups);
	      
	      break;
	    
	    case 'viewstate':
	      var regex = /__VIEWSTATE" value="(?<viewstate>.+)" \/>/
	      var matched = line.match(regex);
	      Object.assign(hidden, matched.groups);
	      
	      break;
	    
	    case 'event:validation':
	      var regex = /__EVENTVALIDATION" value="(?<event_validation>.+)" \/>/
	      var matched = line.match(regex);
	      Object.assign(hidden, matched.groups);

	      break;
	    
	    case 'value:capture':
              //console.log('capture',line);
	      var regex = /id="MainContent_lbl(?<name>\w+)".+>(?<value>.+)</
	      var matched = line.match(regex);

              if (matched != null && fields[matched.groups.name] != undefined) {
	        obj[fields[matched.groups.name]] = matched.groups.value;
	      }

	      break;
	    
	    default:
	      console.log('unexecuted action', modulation);
	      
	      break;
	  }

	}
      }


      return obj
    }, {})


    // adjusting some of the names that are used in the object 
    // so that I can make the addresses most easily disambiuated.


    // not sure if this mangles another test case.
    if (entity.total_authorized_shares != undefined) {
      entity.total_authorized_shares = Number(entity.total_authorized_shares.replace(',', ''))
    }
    
    // not sure if this mangles another test case.
    if (entity.jurisdiction != undefined) {
      entity.jurisdiction = entity.jurisdiction.replace('  the state of ', '');
    }

    if (officers.length > 0) {
      entity.officers = officers;
    }

    if (entity.office_street != undefined) {
      entity.office = {
	address: {
	  street: entity.office_street,
	  suite: entity.office_suite,
	  city: entity.office_city,
	  state: entity.office_state,
	  zip: entity.office_zip
	}
      }
      if (entity.office.address.suite == undefined) {
        delete entity.office.address.suite;
      }

      delete entity.office_street
      delete entity.office_suite
      delete entity.office_city
      delete entity.office_state
      delete entity.office_zip
    }


    if (entity.resident_agent_name != undefined) {
      entity.resident_agent = {
	name: entity.resident_agent_name,
	address: {
	  street: entity.resident_street,
	  suite: entity.resident_suite,
	  city: entity.resident_city,
	  state: entity.resident_state,
	  zip: entity.resident_zip
	}
      }
      
      if (entity.resident_agent.address.suite == undefined) {
        delete entity.resident_agent.address.suite;
      }

      delete entity.resident_agent_name
      delete entity.resident_street
      delete entity.resident_suite
      delete entity.resident_city
      delete entity.resident_state
      delete entity.resident_zip
    }

    entity.filings = filings;

    if (config.hidden != undefined && config.hidden) {
      Object.assign(entity, hidden);
    }

    if (config.meta) {
      meta.data = fingerprint('entity', entity);
      meta.requested_at   = new Date();
      entity.meta  = meta;
    }

    resolve(entity);
  }) 
}

module.exports.entity = entity;
