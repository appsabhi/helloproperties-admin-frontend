const fs = require('fs');

const propPath = 'e:/Fragmentree_/Website/Helloproperties/backend/routes/propertyRoutes.js';
let propContent = fs.readFileSync(propPath, 'utf8');

if (!propContent.includes('findMatchesForCustomProperty')) {
  propContent = propContent.replace('findMatchesForProperty', 'findMatchesForProperty, findMatchesForCustomProperty');
  
  const customPropRoute = `
// POST /api/properties/matches/custom - Find matches for arbitrary custom property criteria
router.post('/matches/custom', async (req, res) => {
  try {
    const { property, threshold = 60 } = req.body;
    if (!property) return res.status(400).json({ success: false, message: 'Property object required' });
    const matches = await findMatchesForCustomProperty(property, threshold);
    return res.status(200).json({ success: true, count: matches.length, matches });
  } catch (error) {
    console.error('Error finding custom property matches:', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate custom matches', error: error.message });
  }
});
`;
  propContent = propContent.replace("router.get('/:id/matches', async (req, res) => {", customPropRoute + "\nrouter.get('/:id/matches', async (req, res) => {");
  fs.writeFileSync(propPath, propContent);
  console.log('Added property custom matches route');
}

const reqPath = 'e:/Fragmentree_/Website/Helloproperties/backend/routes/buyRequirementRoutes.js';
let reqContent = fs.readFileSync(reqPath, 'utf8');

if (!reqContent.includes('findMatchesForCustomRequirement')) {
  reqContent = reqContent.replace('findMatchesForRequirement', 'findMatchesForRequirement, findMatchesForCustomRequirement');
  
  const customReqRoute = `
// POST /api/buy-requirements/matches/custom - Find matches for arbitrary custom requirement criteria
router.post('/matches/custom', async (req, res) => {
  try {
    const { requirement, threshold = 60 } = req.body;
    if (!requirement) return res.status(400).json({ success: false, message: 'Requirement object required' });
    const matches = await findMatchesForCustomRequirement(requirement, threshold);
    return res.status(200).json({ success: true, count: matches.length, matches });
  } catch (error) {
    console.error('Error finding custom requirement matches:', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate custom matches', error: error.message });
  }
});
`;
  reqContent = reqContent.replace("router.get('/:id/matches', async (req, res) => {", customReqRoute + "\nrouter.get('/:id/matches', async (req, res) => {");
  fs.writeFileSync(reqPath, reqContent);
  console.log('Added requirement custom matches route');
}
