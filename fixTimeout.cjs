const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/context/PropertyContext.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/setTimeout\(\(\) => controller\.abort\(\), 1500\)/g, 'setTimeout(() => controller.abort(), 10000)');

fs.writeFileSync(path, content);
console.log('done');
