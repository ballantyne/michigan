# michigan

I just thought I would put this here for the time being.  Maybe there will be a readme someday.  This module isn't quite done.  I still need to figure out the asp form token stuff so I can get the filings.  If you figure it out, make the changes and add them here.

If michigan wants their name back I am happy to hand it over.  Also if they want to maintain this code I would be ok with that too.  

```javascript

var cofs = require('michigan/cofs.lara.state.mi.us');
cofs.entities('ford').then((searchList) => { console.log(searchList) })
```
