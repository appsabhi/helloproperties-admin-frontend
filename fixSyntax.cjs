const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

const search = `{(matchFilter === 'top' ? matchResults.filter(m => m.matchScore >= 90) : matchResults).map((matchItem, idx) => {
                  console.log("MATCH ITEM:", matchItem);
                  return (`

const replace = `{(matchFilter === 'top' ? matchResults.filter(m => m.matchScore >= 90) : matchResults).map((matchItem, idx) => (`

content = content.replace(search, replace);
fs.writeFileSync(path, content, 'utf8');
console.log("Success");
