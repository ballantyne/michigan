const path = require('path');
const http = require(path.join(__dirname, '..', 'utils', 'http'));

const Parser = require(path.join(__dirname, 'parsers'));

const { 
  copyObj,
  constructOptions,
  prepare,
  paths,
  requireJSON
} = require(path.join(__dirname, '..', 'utils'));


var defaults = requireJSON(path.join(__dirname, 'defaults'));
var queries  = requireJSON(path.join(__dirname, 'queries'));

var constructQuery = constructOptions(queries);
var applyOptions = constructOptions(defaults);





const handleError = function(response={}, cache) {
  return new Promise((resolve, reject) => {
    if (response.body == "$(function () {  $('#errorSummary').show(); $('.loader').hide();});") {
      var error = {error: 'There was an error with your request'};
      reject(error);
    } else (
      resolve(response)
    )
  });

}




const findById = function(id, config={}) {
  var params = constructQuery('byId', { SearchValue: id })
  
  if (config.cache == undefined) {
    config.cache = false;
  }

  return new Promise(async(resolve) => {
    var options = applyOptions('default', 'post', {path: paths.search}); 
    config.signature = {options: options, function: 'find', id: id};
    
    var cache = await prepare(config);
    var cached = config.cache && cache.missed == false;

    if (cached == true) {
      var response = JSON.parse(cache.data);
    } else {
      //console.log('new request');
      var response = await http.post(options, params, config);
    }

    handleError(response, cache).then(async(response) => {
      if (cached == false) {
	var options = applyOptions('default', 'get')

	// parse and configure get options
	var url = response.body.replace('window.open(\'', '').replace("','_self')", '')
	options.path = url.replace(options.headers.Origin, '');

	var response = await http.get(options, config);
	
	if (config.cache && cache.missed) {
	  await cache.write(JSON.stringify(response));
	}
      }

      // parse entity
      var entity = await Parser.entity(response.body, config, {url: url});

      if (config.meta && config.response) {
	entity.response = response
      }

      resolve(entity);
    }).catch((error) => {
      resolve(error);
    })
  })
}
module.exports.find = findById;






const search = function(query, config) {
  var params, options;

  if (config.type == 'undefined') {
    config.type = 'entities';
  }

  if (typeof query == 'string') {
    params = constructQuery('sort', 'first', config.type, {SearchValue: query});
  } else {
    params = query;
  }

  options = applyOptions('default', 'post', {path: paths.search})

  if (config.cache == undefined) {
    config.cache = false;
  }

  return new Promise(async(resolve) => {
    config.signature = {function: config.type, options: options, params: params}; 
    var cache = await prepare(config);

    if (config.cache && cache.missed == false) {
      var response = JSON.parse(cache.data);
    } else {
      var response = await http.post(options, params, config);
    }

    var list = await Parser.search(response.body, config, copyObj({params: params}));
    
    if (config.cache && cache.missed) {
      await cache.write(JSON.stringify(response));
    }

    if (config.meta && config.response) {
      list.response = response
    }

    resolve(list);
  })
}
module.exports.search = search;






const entities = function(query, config={}) {
  config.type = 'entities';
  return search(query, config);
}
module.exports.entities = entities;






const people = function(query, config={}) {
  config.type = 'individual';
  return search(query, config);
}
module.exports.individuals = people;




