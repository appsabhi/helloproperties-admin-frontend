const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/backend/services/matchingService.js';
let content = fs.readFileSync(path, 'utf8');

const targetLoop = `let bestDist = null;
  for (const rc of rCoordsArray) {
    if (!rc) continue;
    const lat = rc.latitude ?? rc.lat;
    const lng = rc.longitude ?? rc.lng;
    if (lat == null || lng == null) continue;
    const distKm = calculateHaversineDistance(pCoords.lat, pCoords.lng, Number(lat), Number(lng));
    if (distKm !== null) {
      if (bestDist === null || distKm < bestDist) bestDist = distKm;
    }
  }`;

const replacementLoop = `let bestDist = null;
  let nearestLocationName = null;
  for (const rc of rCoordsArray) {
    if (!rc) continue;
    const lat = rc.latitude ?? rc.lat;
    const lng = rc.longitude ?? rc.lng;
    if (lat == null || lng == null) continue;
    const distKm = calculateHaversineDistance(pCoords.lat, pCoords.lng, Number(lat), Number(lng));
    if (distKm !== null) {
      if (bestDist === null || distKm < bestDist) {
        bestDist = distKm;
        nearestLocationName = rc.locality || rc.location || null;
      }
    }
  }`;

content = content.replace(/let bestDist = null;\s*for \(const rc of rCoordsArray\) \{\s*if \(\!rc\) continue;\s*const lat = rc\.latitude \?\? rc\.lat;\s*const lng = rc\.longitude \?\? rc\.lng;\s*if \(lat == null \|\| lng == null\) continue;\s*const distKm = calculateHaversineDistance\(pCoords\.lat, pCoords\.lng, Number\(lat\), Number\(lng\)\);\s*if \(distKm \!\=\= null\) \{\s*if \(bestDist === null \|\| distKm < bestDist\) bestDist = distKm;\s*\}\s*\}/g, replacementLoop);

fs.writeFileSync(path, content);
console.log('done');
