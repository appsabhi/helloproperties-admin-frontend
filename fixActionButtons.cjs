const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// Remove setViewingDetailTarget(null); from action buttons
content = content.replace(
  /const target = viewingDetailTarget;\s*setViewingDetailTarget\(null\);\s*handleOpenMatches\(target\.type, target\.item\);/g,
  `const target = viewingDetailTarget;
                      handleOpenMatches(target.type, target.item);`
);

content = content.replace(
  /const target = viewingDetailTarget;\s*setViewingDetailTarget\(null\);\s*if \(target\.type === 'property'\) \{/g,
  `const target = viewingDetailTarget;
                      if (target.type === 'property') {`
);

content = content.replace(
  /const target = viewingDetailTarget;\s*setViewingDetailTarget\(null\);\s*setDeletingTarget\(\{ type: target\.type, item: target\.item \}\);/g,
  `const target = viewingDetailTarget;
                      setDeletingTarget({ type: target.type, item: target.item });`
);

content = content.replace(
  /const propObj = viewingDetailTarget\.item;\s*setViewingDetailTarget\(null\);\s*setSharingTarget\(\{ property: propObj, buyer: null \}\);/g,
  `const propObj = viewingDetailTarget.item;
                      setSharingTarget({ property: propObj, buyer: null });`
);


fs.writeFileSync(path, content, 'utf8');
console.log("Fixed action buttons in details view");
