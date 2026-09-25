const { findMatchesForProperty } = require('../backend/services/matchingService.js');

async function test() {
  const matches = await findMatchesForProperty(399, 0);
  const req139 = matches.find(m => m.id === 139 || m.requirementId === 139 || m.requirementId === '139' || m.id === '139');
  console.log(req139);
}
test().catch(console.error);
