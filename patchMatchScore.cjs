const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/backend/services/matchingService.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /const totalScore = Math\.round\(typeScore \+ locResult\.score \+ areaScore \+ priceScore \+ descScore\);\s*const finalScore = Math\.min\(100, Math\.max\(0, totalScore\)\);\s*return \{ matchScore: finalScore, distanceKm: locResult\.distanceKm, nearestLocationName: locResult\.nearestLocationName \};/;

const replacement = `// HARD ELIGIBILITY CHECK: If coordinates exist but are > 5km, score is -1
  if (locResult.score === -1) {
    return { matchScore: 0, distanceKm: locResult.distanceKm, nearestLocationName: locResult.nearestLocationName };
  }

  const totalScore = Math.round(typeScore + locResult.score + areaScore + priceScore + descScore);
  const finalScore = Math.min(100, Math.max(0, totalScore));

  return { matchScore: finalScore, distanceKm: locResult.distanceKm, nearestLocationName: locResult.nearestLocationName };`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log('done');
