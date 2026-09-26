const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace top
const regexTop = /\{\(matchFilter === 'top' \? matchResults\.filter\(m => m\.matchScore >= 90\) : matchResults\)\.map\(\(matchItem, idx\) => \{\s*console\.log\("MATCH ITEM:", matchItem\);\s*return \(/;
const replaceTop = `{(matchFilter === 'top' ? matchResults.filter(m => m.matchScore >= 90) : matchResults).map((matchItem, idx) => (`;

content = content.replace(regexTop, replaceTop);

// Ensure the bottom is correct
content = content.replace(/\)\}\)\}\s*<\/div>/, `))}\n              </div>`);

fs.writeFileSync(path, content, 'utf8');
console.log("Success");
