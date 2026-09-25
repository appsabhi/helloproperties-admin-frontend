const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/backend/services/matchingService.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /if \(bestDist !== null\) \{[\s\S]*?return \{ score: 0, distanceKm: null, nearestLocationName: null \};\n\}/;

const replacement = `if (bestDist !== null) {
    if (bestDist <= 5.0) {
      // Hard eligibility condition: locationMatch = nearestDistanceKm <= 5.
      // We give a flat 25 points to keep the 100-point scale intact, avoiding variable location score contributions.
      return { score: 25, distanceKm: bestDist, nearestLocationName };
    } else {
      // Hard fail if distance is > 5km (Excluded)
      return { score: -1, distanceKm: bestDist, nearestLocationName };
    }
  }

  return { score: 0, distanceKm: null, nearestLocationName: null };
}`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log('done');
