const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<label className="text-\[11px\] font-bold text-slate-600 uppercase block mb-1">Location \/ Locality<\/label>/;
const replacement = ``;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log('done');
