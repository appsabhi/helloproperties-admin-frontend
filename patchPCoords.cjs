const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/backend/services/matchingService.js';
let content = fs.readFileSync(path, 'utf8');

const regex1 = /if \(\!pCoords \|\| pCoords\.lat == null \|\| pCoords\.lng == null \|\| \!rCoords\) \{/;
const replacement1 = `
  let pCoordsArray = Array.isArray(pCoords) ? pCoords : (pCoords ? [pCoords] : []);
  let rCoordsArray = Array.isArray(rCoords) ? rCoords : (rCoords ? [rCoords] : []);
  if (pCoordsArray.length === 0 || rCoordsArray.length === 0) {`;

const regex2 = /let rCoordsArray = Array\.isArray\(rCoords\) \? rCoords : \[rCoords\];\s*if \(rCoordsArray\.length === 0\) return \{ score: 0, distanceKm: null, nearestLocationName: null \};\s*let bestDist = null;\s*let nearestLocationName = null;\s*for \(const rc of rCoordsArray\) \{[\s\S]*?\}\n  \}/;

const replacement2 = `let bestDist = null;
  let nearestLocationName = null;
  
  for (const pc of pCoordsArray) {
    if (!pc) continue;
    const pLat = pc.latitude ?? pc.lat;
    const pLng = pc.longitude ?? pc.lng;
    if (pLat == null || pLng == null) continue;

    for (const rc of rCoordsArray) {
      if (!rc) continue;
      const rLat = rc.latitude ?? rc.lat;
      const rLng = rc.longitude ?? rc.lng;
      if (rLat == null || rLng == null) continue;
      
      const distKm = calculateHaversineDistance(Number(pLat), Number(pLng), Number(rLat), Number(rLng));
      if (distKm !== null) {
        if (bestDist === null || distKm < bestDist) {
          bestDist = distKm;
          nearestLocationName = rc.locality || rc.location || pc.locality || pc.location || null;
        }
      }
    }
  }`;

content = content.replace(regex1, replacement1);
content = content.replace(regex2, replacement2);

// Fix calculateMatchScore passing array
const matchScoreRegex = /\(property\.latitude && property\.longitude\) \? \{ lat: Number\(property\.latitude\), lng: Number\(property\.longitude\) \} : null,/;
const matchScoreReplacement = `(property.preferred_coordinates ? (typeof property.preferred_coordinates === 'string' ? JSON.parse(property.preferred_coordinates) : property.preferred_coordinates) : ((property.latitude && property.longitude) ? [{ lat: Number(property.latitude), lng: Number(property.longitude) }] : null)),`;
content = content.replace(matchScoreRegex, matchScoreReplacement);

fs.writeFileSync(path, content);
console.log('done');
