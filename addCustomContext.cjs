const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/context/PropertyContext.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('getCustomPropertyMatches')) {
  const code = `
  const getCustomPropertyMatches = async (mockProp, threshold = 60) => {
    try {
      const response = await fetch(\`\${API_BASE_URL}/properties/matches/custom\`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ property: mockProp, threshold })
      });
      if (response.ok) {
        const resData = await response.json();
        return resData.matches || [];
      }
      return [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const getCustomRequirementMatches = async (mockReq, threshold = 60) => {
    try {
      const response = await fetch(\`\${API_BASE_URL}/buy-requirements/matches/custom\`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ requirement: mockReq, threshold })
      });
      if (response.ok) {
        const resData = await response.json();
        return resData.matches || [];
      }
      return [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };
`;
  content = content.replace('const getPropertyMatches = async', code + '\n  const getPropertyMatches = async');
  
  content = content.replace('getPropertyMatches,\n      getRequirementMatches,', 'getPropertyMatches,\n      getRequirementMatches,\n      getCustomPropertyMatches,\n      getCustomRequirementMatches,');
  
  fs.writeFileSync(path, content);
  console.log('Added custom matching context functions');
}
