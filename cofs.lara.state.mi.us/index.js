const path = require('path');
const https = require('https');
const qs = require('querystring');


const Cache = require('cache-rules-everything-around-me');
const Parser = require(path.join(__dirname, 'parsers'));






const service = {
  protocol: "https:", 
  hostname: "cofs.lara.state.mi.us", 
  paths: {
    search: "/SearchApi/Search/Search/GetSearchResults"
  }
}





function applyDefaults(params) {
  if (params.StartRange == undefined) {
    params.StartRange = 1
  }
  
  if (params.EndRange == undefined) {
    params.EndRange = 25
  }
  
  if (params.SortColumn == undefined) { 
    params.SortColumn = ''; 
  }
  
  if (params.SortDirection == undefined) {
    params.SortDirection = ''; 
  }
  
  return params;
}



const get = function(_path, config={}) {
  var cacheOptions = {};
  
  var options = {
    method: 'GET',
    hostname: service.hostname,
    headers: {
      Host:    "cofs.lara.state.mi.us",
      Origin:  "https://cofs.lara.state.mi.us",
      Referer: "https://cofs.lara.state.mi.us/SearchApi/Search/Search",
    }
  }

  if (/^https/.test(_path)) {
    _path = _path.replace(options.headers.Origin, '');
  }

  options.path = _path;


  if (config.parse == undefined) {
    config.parse = true;
  }


  if (config.cache == undefined) {
    config.cache == false;
  }
  

  if (config.ttl) {
    cacheOptions.ttl = config.ttl;
  }


  return new Promise((resolve,reject) => {
    var cache = new Cache({
      silo: 'lara.cofs', 
      signature: {options: options}
    })

    cache.fetch(cacheOptions).then(async() => {
      if (cache.missed) {
	if (config.verbose) {
          console.log('no cache');
	}

	const req = https.request(options, res => {
	  const chunks = [];

	  res.on('data', data => chunks.push(data))

	  res.on('end', async() => {
	    let resBody = Buffer.concat(chunks).toString();
          
	    if (config.cache) {
	      await cache.write(resBody);
	    } 
            
	    resolve(resBody);
	  });
	})

	req.on('error',reject);

	req.end();
      } else {
	resolve(cache.data);
      }

    })
  })

}









const post = function(_path, data, config={}) {
  var cacheOptions = {};

  if (config.parse == undefined) {
    config.parse = true;
  }

  if (config.cache == undefined) {
    config.cache == false;
  }

  if (config.ttl) {
    cacheOptions.ttl = config.ttl;
  }

  if (data != undefined) {
    var postData = qs.stringify(data);
  }

  return new Promise((resolve,reject) => {
    var options = {
      method: 'POST',
      hostname: service.hostname,
      path:     _path,
      headers: {
	"Content-Length": postData.length,
	"Content-Type":  "application/x-www-form-urlencoded; charset=UTF-8",
	Host:    "cofs.lara.state.mi.us",
	Origin:  "https://cofs.lara.state.mi.us",
	Referer: "https://cofs.lara.state.mi.us/SearchApi/Search/Search",
      }
    }

    //console.log(options);
    //console.log('data:',data);
    
    var cache = new Cache({
      silo: 'lara.cofs', 
      signature: {options: options, data: postData}
    })

    cache.fetch(cacheOptions).then(async() => {
      if (cache.missed) {
	if (config.verbose) {
          console.log('no cache');
	}

	const req = https.request(options, res => {
	  const chunks = [];

	  res.on('data', data => chunks.push(data))

	  res.on('end', async() => {
	    let resBody = Buffer.concat(chunks).toString();
          
	    if (config.cache) {
	      await cache.write(resBody);
	    } 
            
	    resolve(resBody);
	  
	  });

	})

	req.on('error',reject);

	if (data != undefined) {
	  req.write(postData)
	}

	req.end();
      } else {
	resolve(cache.data);
      }

    })
  })
}
module.exports.post = post;







const entities = function(params, config={}) {
  if (typeof params == 'string') {
    params = {SearchValue: params}
  }

  params = applyDefaults(params);

  if (params.SearchType == undefined) {
    params.SearchType = 'E';
  } 

  if (params.SearchMethod == undefined) {
    params.SearchMethod = 'B';
  }
  //console.log(params);

  return new Promise((resolve) => {
    post(service.paths.search, params, config).then(async(html) => {
      var list = await Parser.parse(html, config, {params: params});
      resolve(list);
    }).catch(console.log);
  })
}
module.exports.entities = entities;







const individuals = function(params, config={}) {
  if (typeof params == 'string') {
    params = {SearchValue: params}
  }

  params = applyDefaults(params);

  if (params.SearchType == undefined) {
    params.SearchType = 'I';
  } 
 
  if (params.SearchMethod == undefined) {
    params.SearchMethod = 'B';
  } 
 
  //console.log(params);

  return new Promise((resolve) => {
    post(service.paths.search, params, config).then(async(html) => {
      var list = await Parser.parse(html, config, {params: params});
      resolve(list);
    })
  })
}
module.exports.individuals = individuals;







const entity = function(url, config={}) {
  return new Promise((resolve) => {
    get(url, config).then(async(html) => {
      var list = await Parser.company(html, config, {url: url});
      resolve(list);
    });
  })
}
module.exports.entity = entity;







const byId = function(id, config={}) {
  var params = {
    SearchValue: id,
    SearchType: 'N'
  }

  config.parse = false; 

  return new Promise((resolve) => {
    post(service.paths.search, params, config).then(async(html) => {
      var url = html.replace('window.open(\'', '').replace("','_self')", '')
      entity(url, config).then(async(data) => {
        resolve(data);
      });
    })
  })
}
module.exports.byId = byId;





