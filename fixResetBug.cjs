const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// Remove setViewingDetailTarget(null) from second useEffect
content = content.replace(
  /setSharingTarget\(null\);\s*setViewingDetailTarget\(null\);/g,
  `setSharingTarget(null);`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed viewingDetailTarget reset bug!");
