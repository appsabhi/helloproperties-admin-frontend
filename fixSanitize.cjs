const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/context/PropertyContext.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\/\/ 4\. Hard filter: Locality matching if both specify locality\s*if \(targetLoc && itemLoc\) \{\s*const locRes = computeLocalityScore\(targetLoc, itemLoc, targetDist, itemDist\);\s*if \(locRes\.isOverlap === false\) return false;\s*\}/;

const replacement = `// 4. Hard filter: Locality matching if both specify locality\n      // Only apply this string-based filter if we don't have exact coordinate distance confirmed by the backend\n      if (targetLoc && itemLoc && item.distanceKm == null) {\n        const locRes = computeLocalityScore(targetLoc, itemLoc, targetDist, itemDist);\n        if (locRes.isOverlap === false) return false;\n      }`;

content = content.replace(regex, replacement);

fs.writeFileSync(path, content);
console.log('done');
