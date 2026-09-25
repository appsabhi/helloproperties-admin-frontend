const fs = require('fs');

const path = 'e:/Fragmentree_/Website/Helloproperties/backend/services/matchingService.js';
let content = fs.readFileSync(path, 'utf8');

// Edit 1: calculateLocationScore return values
content = content.replace(
  'if (!pCoords || pCoords.lat == null || pCoords.lng == null || !rCoords) {\r\n      return { score: 0, distanceKm: null };',
  'if (!pCoords || pCoords.lat == null || pCoords.lng == null || !rCoords) {\r\n      return { score: 0, distanceKm: null, nearestLocationName: null };'
);

content = content.replace(
  'let rCoordsArray = Array.isArray(rCoords) ? rCoords : [rCoords];\r\n    if (rCoordsArray.length === 0) return { score: 0, distanceKm: null };',
  'let rCoordsArray = Array.isArray(rCoords) ? rCoords : [rCoords];\r\n    if (rCoordsArray.length === 0) return { score: 0, distanceKm: null, nearestLocationName: null };'
);

// Edit 1b: calculateLocationScore bestDist tracking
content = content.replace(
  'let bestDist = null;\r\n    for (const rc of rCoordsArray) {\r\n      if (!rc) continue;\r\n      const lat = rc.latitude ?? rc.lat;\r\n      const lng = rc.longitude ?? rc.lng;\r\n      if (lat == null || lng == null) continue;\r\n      const distKm = calculateHaversineDistance(pCoords.lat, pCoords.lng, Number(lat), Number(lng));\r\n      if (distKm !== null) {\r\n        if (bestDist === null || distKm < bestDist) bestDist = distKm;\r\n      }\r\n    }',
  'let bestDist = null;\r\n    let nearestLocationName = null;\r\n    for (const rc of rCoordsArray) {\r\n      if (!rc) continue;\r\n      const lat = rc.latitude ?? rc.lat;\r\n      const lng = rc.longitude ?? rc.lng;\r\n      if (lat == null || lng == null) continue;\r\n      const distKm = calculateHaversineDistance(pCoords.lat, pCoords.lng, Number(lat), Number(lng));\r\n      if (distKm !== null) {\r\n        if (bestDist === null || distKm < bestDist) {\r\n          bestDist = distKm;\r\n          nearestLocationName = rc.locality || null;\r\n        }\r\n      }\r\n    }'
);

content = content.replace(
  'score = 0; // > 25 km distance\r\n      }\r\n      return { score, distanceKm: bestDist };\r\n    }\r\n  \r\n    return { score: 0, distanceKm: null };',
  'score = 0; // > 25 km distance\r\n      }\r\n      return { score, distanceKm: bestDist, nearestLocationName };\r\n    }\r\n  \r\n    return { score: 0, distanceKm: null, nearestLocationName: null };'
);


// Edit 2: calculateMatchScore return
content = content.replace(
  'if (!property || !requirement) return { matchScore: 0, distanceKm: null };',
  'if (!property || !requirement) return { matchScore: 0, distanceKm: null, nearestLocationName: null };'
);

content = content.replace(
  'if ((isPropSale && !isReqBuy) || (!isPropSale && isReqBuy)) {\r\n      return { matchScore: 0, distanceKm: null }; // NEVER match Sale with Rent or Rent with Buy',
  'if ((isPropSale && !isReqBuy) || (!isPropSale && isReqBuy)) {\r\n      return { matchScore: 0, distanceKm: null, nearestLocationName: null }; // NEVER match Sale with Rent or Rent with Buy'
);

content = content.replace(
  'const totalScore = Math.round(typeScore + locResult.score + areaScore + priceScore + descScore);\r\n    const finalScore = Math.min(100, Math.max(0, totalScore));\r\n  \r\n    return { matchScore: finalScore, distanceKm: locResult.distanceKm };',
  'const totalScore = Math.round(typeScore + locResult.score + areaScore + priceScore + descScore);\r\n    const finalScore = Math.min(100, Math.max(0, totalScore));\r\n  \r\n    return { matchScore: finalScore, distanceKm: locResult.distanceKm, nearestLocationName: locResult.nearestLocationName };'
);


// Edit 3: findMatchesForProperty
content = content.replace(
  'const { matchScore, distanceKm } = await calculateMatchScore(property, req);\r\n      if (matchScore >= minScore) {\r\n        matches.push({\r\n          id: req.id,',
  'const { matchScore, distanceKm, nearestLocationName } = await calculateMatchScore(property, req);\r\n      if (matchScore >= minScore) {\r\n        matches.push({\r\n          id: req.id,'
);

content = content.replace(
  'matchScore,\r\n          distanceKm\r\n        });\r\n      }\r\n    }\r\n  \r\n    matches.sort((a, b) => b.matchScore - a.matchScore);',
  'matchScore,\r\n          distanceKm,\r\n          nearestLocationName\r\n        });\r\n      }\r\n    }\r\n  \r\n    matches.sort((a, b) => b.matchScore - a.matchScore);'
);


// Edit 4: findMatchesForRequirement
content = content.replace(
  'const { matchScore, distanceKm } = await calculateMatchScore(prop, requirement);\r\n      if (matchScore >= minScore) {\r\n        matches.push({\r\n          id: prop.id,',
  'const { matchScore, distanceKm, nearestLocationName } = await calculateMatchScore(prop, requirement);\r\n      if (matchScore >= minScore) {\r\n        matches.push({\r\n          id: prop.id,'
);

// We need to be careful with the last replace since it might be ambiguous. Let's use a more specific regex.
content = content.replace(
  /matchScore,\s*distanceKm\s*}\);\s*}\s*}\s*matches\.sort\(\(a, b\) => b\.matchScore - a\.matchScore\);\s*return matches;\s*}\s*$/g,
  'matchScore,\n          distanceKm,\n          nearestLocationName\n        });\n      }\n    }\n\n    matches.sort((a, b) => b.matchScore - a.matchScore);\n    return matches;\n  }'
);

fs.writeFileSync(path, content);
console.log('done');
