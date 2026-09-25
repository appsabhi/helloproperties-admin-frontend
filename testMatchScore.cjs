const { calculateLocationScore } = require('../backend/services/matchingService.js');

async function run() {
  const cases = [
    { name: '0.7 km', bestDist: 0.7, pCoords: {lat: 10, lng: 76}, rCoords: [{lat: 10.006, lng: 76}] },
    { name: '1.0 km', bestDist: 1.0, pCoords: {lat: 10, lng: 76}, rCoords: [{lat: 10.009, lng: 76}] },
    { name: '4.99 km', bestDist: 4.99, pCoords: {lat: 10, lng: 76}, rCoords: [{lat: 10.0449, lng: 76}] },
    { name: '5.0 km', bestDist: 5.0, pCoords: {lat: 10, lng: 76}, rCoords: [{lat: 10.045, lng: 76}] },
    { name: '5.01 km', bestDist: 5.01, pCoords: {lat: 10, lng: 76}, rCoords: [{lat: 10.0451, lng: 76}] },
    { name: '10 km', bestDist: 10, pCoords: {lat: 10, lng: 76}, rCoords: [{lat: 10.09, lng: 76}] },
  ];

  console.log('--- BASIC DISTANCE CHECKS ---');
  for (const c of cases) {
    const res = await calculateLocationScore('loc', 'dist', 'loc', 'dist', '', '', c.pCoords, c.rCoords);
    console.log(`${c.name} -> score: ${res.score}, distanceKm: ${res.distanceKm} (Included: ${res.score !== -1})`);
  }

  console.log('--- MULTIPLE LOCATIONS ---');
  const pCoords2 = { lat: 10, lng: 76 };
  // 10, 76 to 10.144, 76 is ~ 16km
  // 10, 76 to 10.009, 76 is ~ 1km
  // 10, 76 to 10.09, 76 is ~ 10km
  const rCoords2 = [
    { locality: 'Mavoor', lat: 10.144, lng: 76 },
    { locality: 'Pottammal', lat: 10.009, lng: 76 },
    { locality: 'Kunnamangalam', lat: 10.09, lng: 76 }
  ];
  const res2 = await calculateLocationScore('loc', 'dist', 'loc', 'dist', '', '', pCoords2, rCoords2);
  console.log(`Expected MATCH, nearestLocationName = Pottammal, distanceKm = 1.00`);
  console.log(`Result: score: ${res2.score}, nearestLocationName = ${res2.nearestLocationName}, distanceKm = ${res2.distanceKm} (Included: ${res2.score !== -1})`);
}
run();
