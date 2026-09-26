const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/context/PropertyContext.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\/\/ 4\. Hard filter: Locality matching if both specify locality[\s\S]*?return \(item\.matchScore \|\| 0\) >= 60;/;

const replacement = `// 4. We rely on the match score instead of a hard string-based locality rejection
        // Return matches with a score of 50 or higher (Properties.jsx controls dynamic threshold)
        return (item.matchScore || 0) >= 50;`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Failed to match regex");
}
