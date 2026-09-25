const { calculateLocationScore } = require('../backend/services/matchingService.js');

async function run() {
  const pCoords = { lat: 11.25, lng: 75.78 };
  const rCoords = [
    { locality: 'Kozhikode', lat: 11.2587, lng: 75.7804 },
    { locality: 'Pottammal', lat: 11.255, lng: 75.782 }
  ];
  
  const res = await calculateLocationScore('Pottammal', 'Kozhikode', 'Mavoor', 'Kozhikode', 'Kerala', 'Kerala', pCoords, rCoords);
  console.log(res);
}

run();
