const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/context/PropertyContext.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /if \(targetDist && itemDist && targetDist !== itemDist\) \{\s*return false; \/\/ Disqualify cross-district items \(e\.g\. Kannur for Palakkad\)\s*\}/;

const replacement = `// Only apply this string-based filter if we don't have exact coordinate distance confirmed by the backend\n      if (targetDist && itemDist && targetDist !== itemDist && item.distanceKm == null) {\n        return false; // Disqualify cross-district items (e.g. Kannur for Palakkad)\n      }`;

content = content.replace(regex, replacement);

fs.writeFileSync(path, content);
console.log('done');
