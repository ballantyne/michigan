const path = require('path');
const http = require(path.join(__dirname, 'http'));

const Parser = require(path.join(__dirname, 'parsers'));

const { 
  applyOptions,
  constructQuery,
  prepare,
  paths
} = require(path.join(__dirname, 'tools'));






const findById = function(id, config={}) {
  var params = constructQuery('byId', { SearchValue: id })
  
  if (config.cache == undefined) {
    config.cache = false;
  }

  return new Promise(async(resolve) => {
    var options = applyOptions('default', 'post', {path: paths.search}); 
    config.signature = {options: options, function: 'find', id: id};
    var cache = await prepare(config);

    if (config.cache && cache.missed == false) {
      var response = JSON.parse(cache.data);
    } else {
      // fetch redirect
      var response = await http.post(options, params, config);
      
      var options = applyOptions('default', 'get')

      // parse and configure get options
      var url = response.body.replace('window.open(\'', '').replace("','_self')", '')
      options.path = url.replace(options.headers.Origin, '');

      //console.log(options);

      var response = await http.get(options, config);
    }

    // parse entity
    var entity = await Parser.entity(response.body, config, {url: url});

    if (config.cache && cache.missed) {
      await cache.write(JSON.stringify(response));
    }

    if (config.meta && config.response) {
      entity.response = response
    }
  
    resolve(entity);
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

    var list = await Parser.search(response.body, config, {params: params});
    
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




