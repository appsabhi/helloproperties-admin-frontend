const { calculateHaversineDistance, calculateLocationScore } = require('../backend/services/matchingService.js');
async function run() {
  const d = calculateHaversineDistance(10, 76, 10.046, 76);
  console.log(`d = ${d}`);
  const res = await calculateLocationScore('loc', 'dist', 'loc', 'dist', '', '', {lat: 10, lng: 76}, [{lat: 10.046, lng: 76}]);
  console.log(res);
}
run();
