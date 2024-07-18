const path = require('path');
const os = require('os');
const fs = require('fs');
const { createHmac } = require('node:crypto');
const sortKeysRecursive = require('sort-keys-recursive');
const Cache = require('cache-rules-everything-around-me');



module.exports.paths = {
  search: "/SearchApi/Search/Search/GetSearchResults"
}


function readJSON(file) {
  var data = fs.readFileSync(file);
  var string = data.toString();
  var json
  try {
    json = JSON.parse(string);
  } catch(error) {
    console.log(file);
    console.log(string);
    console.log(error);
  }

  return json;
}
module.exports.readJSON = readJSON;


function requireJSON(file) {
  if (process.env.NODE_ENV == 'production') {
    return require(file)
  } else {
    return readJSON([file, 'json'].join('.'));
  }
}
module.exports.requireJSON = requireJSON;


var defaults = requireJSON(path.join(__dirname, 'defaults'));
var queries  = requireJSON(path.join(__dirname, 'queries'));






const prepareCache = function(config) {

  if (config.name == undefined) {
    config.name = 'cofs.lara.state.mi.us';
  } else {
    config.name = path.join('cofs.lara.state.mi.us', config.name);
  }

  if (process.env.NODE_ENV == 'test' && config.folder == undefined) {
    config.folder = path.join(__dirname, '..', 'test', 'data');
  } else {
    config.folder = path.join(os.tmpdir(), 'cream', config.name);
  }

  var cache = new Cache({
    silo: config.name, 
    signature: config.signature,
    folder: config.folder 
  })

  var cacheOptions = {};

  if (config.ttl != undefined) {
    cacheOptions.ttl = config.ttl;
  }

  if (config.cache) {
    return new Promise((resolve) => {
      cache.fetch(cacheOptions).then(() => {
	resolve(cache);
      });
    })
  } else {
    return new Promise((resolve) => {
      cache.missed = true;
      resolve(cache);
    })
  }

}
module.exports.prepare = prepareCache;








const copyObj = function(options={}) {
  return JSON.parse(JSON.stringify(options));
}
module.exports.copyObj = copyObj;








// spooky things happen without the copyObj.  
// need to investigate further later.  
// I think the merge is doing something weird. 

const constructOptions = function(cfg={}) {
  return function(...options) {
    var specificOptions = {};

    specificOptions = options.reduce((obj, current, index) => {
      obj = copyObj(obj);
      if (typeof current == 'string' && cfg[current] != undefined) {
	obj = merge(obj, copyObj(cfg[current]));
      } else {
	obj = merge(obj, copyObj(current));
      }
      return obj;
    }, specificOptions)

    return specificOptions;
  }
}
module.exports.constructOptions = constructOptions;




var constructQuery = constructOptions(queries);
module.exports.constructQuery = constructQuery;



var applyOptions = constructOptions(defaults);
module.exports.applyOptions = applyOptions;







function newCursor(meta) {
  var toAssign = {};
  
  var cursor = copyObj(meta.params);
  delete cursor.StartRange;
  delete cursor.EndRange;

  var newPagination = {};
  
  var pageSize = meta.params.EndRange-meta.params.StartRange;
  newPagination.StartRange = meta.params.EndRange + 1;
  newPagination.EndRange = pageSize + newPagination.StartRange;

  if (newPagination.EndRange > meta.total_records) {
    newPagination.EndRange = meta.total_records;
  } 

  if (newPagination.StartRange < meta.total_records) {
    Object.assign(cursor, newPagination);
    toAssign.next_cursor = cursor;  
  }
  
  return toAssign;
}
module.exports.newCursor = newCursor;








var modulatorize = function(transitions) {
  return function(state, line) {

    var any = transitions.filter((transition) => { 
      return transition.states == undefined;
    });

    var currentState = transitions.filter((transition) => { 
      return transition.states != undefined && transition.states.indexOf(state) > -1;
    });

    var relevant = any.concat(currentState);

    var array = relevant.filter((transition) => { 
      switch(transition.trigger.type) {
	case 'endsWith':
	  return line[line.length-1] == transition.trigger.value;
	case 'contains':
	  return line.indexOf(transition.trigger.value) > -1;
	case 'startsWith':
	  return line.indexOf(transition.trigger.value) == 0;
	case 'exact':
	  return line == transition.trigger.value;
	default:
	  return false;
      }
    });

    if (array.length > 0) {
      return array;
    } else {
      return [];
    }

  }
}
module.exports.modulatorize = modulatorize;






const extractor = function(regexs) {
  return function(line) {
    return regexs.filter((regex) => {
      return regex.test(line);
    }).reduce((obj, regex) => {
      var matched = line.match(regex);
      Object.assign(obj, matched.groups);

      return obj;

    }, {})
  }
}

module.exports.extractor = extractor;






const extraction = {
  address: extractor([
    /(?<street>.+)\s<br\/>\s(?<city>.+),\s(?<state>.+)\s(?<zip>\d+)\s(?<country>\S+)/,
    /(?<street>.+)\s<br\/>\s(?<city>.+),\s(?<state>.+)\s(?<zip>\d+)/,
    /^<br\/>\s(?<country>\w+)/
  ])
}
module.exports.extraction = extraction;







const fingerprint = function(namespace, string) {
  if (typeof string != 'string') {
    // maybe this needs to be smarter and be able to handle arrays.
    var sorted = sortKeysRecursive(string)
    string = JSON.stringify(sorted);
  }

  var buffer = Buffer.from(string); 
  var signature = buffer.toString('base64');


  return createHmac('sha256', namespace)
    .update(signature)
    .digest('hex');
}
module.exports.fingerprint = fingerprint;







var ignoramous = function(rules) {
  return function(line) {

    var array = rules.map((rule) => { 
      switch(rule.type) {
	case 'contains':
	  return line.indexOf(rule.value) > -1;
	case 'startsWith':
	  return line.indexOf(rule.value) == 0;
	case 'exact':
	  return line == rule.value;
	default:
	  return false;
      }
    });

    return array.indexOf(true) == -1;
  }
}
module.exports.ignoramous = ignoramous;







const merge = function(obj1={}, obj2={}) {
  for (let key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
	obj1[key] = merge(obj1[key], obj2[key]);
      } else {
	obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
}
module.exports.merge = merge;






