const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/backend/services/matchingService.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('findMatchesForCustomProperty')) {
  const code = `
export async function findMatchesForCustomProperty(property, minScore = 60) {
  const reqsRes = await query("SELECT * FROM buy_requirements WHERE status != 'Suspended' ORDER BY created_at DESC;");
  const matches = [];
  for (const req of reqsRes.rows) {
    const result = await calculateMatchScore(property, req);
    if (result.matchScore >= minScore) {
      matches.push({ ...req, matchScore: result.matchScore, distanceKm: result.distanceKm, nearestLocationName: result.nearestLocationName });
    }
  }
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

export async function findMatchesForCustomRequirement(requirement, minScore = 60) {
  const propsRes = await query("SELECT * FROM properties WHERE status != 'Inactive' ORDER BY created_at DESC;");
  const matches = [];
  for (const prop of propsRes.rows) {
    const result = await calculateMatchScore(prop, requirement);
    if (result.matchScore >= minScore) {
      matches.push({ ...prop, matchScore: result.matchScore, distanceKm: result.distanceKm, nearestLocationName: result.nearestLocationName });
    }
  }
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}
`;
  content += code;
  fs.writeFileSync(path, content);
  console.log('Added custom matching functions to matchingService.js');
}
