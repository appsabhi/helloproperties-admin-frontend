const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/backend/services/matchingService.js';
let content = fs.readFileSync(path, 'utf8');

// Use regex to catch any whitespace
content = content.replace(/return \{ score: 0, distanceKm: null \};/g, 'return { score: 0, distanceKm: null, nearestLocationName: null };');

content = content.replace(/return \{ score, distanceKm: bestDist \};/g, 'return { score, distanceKm: bestDist, nearestLocationName };');

content = content.replace(/return \{ matchScore: 0, distanceKm: null \};/g, 'return { matchScore: 0, distanceKm: null, nearestLocationName: null };');

content = content.replace(/return \{ matchScore: finalScore, distanceKm: locResult\.distanceKm \};/g, 'return { matchScore: finalScore, distanceKm: locResult.distanceKm, nearestLocationName: locResult.nearestLocationName };');

fs.writeFileSync(path, content);
console.log('done');
