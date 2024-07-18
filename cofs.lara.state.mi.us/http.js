const path  = require('path');
const https = require('https');
const qs    = require('querystring');

const { applyOptions, copyObj, merge, constructOptions } = require(path.join(__dirname, 'tools'));








const post = function(options={}, postData="", config={}) {
  
  if (config.data == undefined) {
    config.data = false;
  }
  
  if (postData != undefined) {
    if (typeof postData != 'string') {
      var postData = qs.stringify(postData);
    }
    options.headers['Content-Length'] = postData.length;
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      const chunks = [];

      res.on('data', data => chunks.push(data))

      res.on('end', async() => {
	var data = Buffer.concat(chunks);

	if (config.data != true) {
	  data = data.toString();
	}

	//console.log(res.headers);

	resolve({headers: res.headers, body: data});
      });
    })

    req.on('error',reject);

    if (postData != undefined) {
      //console.log(postData);
      req.write(postData)
    }

    req.end();
  })
}
module.exports.post = post;









const get = function(options, config={}) {
  if (config.data == undefined) {
    config.data = false;
  }

  //console.log('get', options);

  return new Promise((resolve,reject) => {
    const req = https.request(options, res => {
      const chunks = [];


      //console.log('requesting');

      res.on('data', data => chunks.push(data))

      res.on('end', async() => {
	let data = Buffer.concat(chunks);
	
	if (config.data == false) {
	  data = data.toString();
        }

	//console.log('data', data);

	var response = {headers: res.headers, body: data};

	resolve(response);
      });
    })

    req.on('error',reject);

    req.end();
  })

};
module.exports.get = get;




