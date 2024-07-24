const path = require('path');
const os = require('os');



const { 
  extract, 
  cp, 
  merge, 
  requireJSON,
  construct
} = require('great-lakes');


module.exports.paths = {
  search: "/SearchApi/Search/Search/GetSearchResults"
}




function newCursor(meta) {
  var toAssign = {};
  
  var cursor = cp(meta.params);
  delete cursor.StartRange;
  delete cursor.EndRange;

  //console.log(meta);
 
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








const extraction = {
  address: extract([
    /(?<street>.+)\s<br\/>\s(?<city>.+),\s(?<state>.+)\s(?<zip>\d+)\s(?<country>\S+)/,
    /(?<street>.+)\s<br\/>\s(?<city>.+),\s(?<state>.+)\s(?<zip>\d+)/,
    /^<br\/>\s(?<country>\w+)/
  ])
}
module.exports.extraction = extraction;







