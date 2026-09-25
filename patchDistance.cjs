const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/backend/services/matchingService.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /const c = 2 \* Math\.atan2\(Math\.sqrt\(a\), Math\.sqrt\(1 - a\)\);\s*return Math\.round\(\(R \* c\) \* 10\) \/ 10; \/\/ Rounded to 1 decimal place \(e\.g\. 3\.2 km\)/;

const replacement = `const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Exact unrounded distance for strict eligibility check`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log('done');
