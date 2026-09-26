const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/context/PropertyContext.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\/\/ 3\. Hard filter: District matching[\s\S]*?return \(item\.matchScore \|\| 0\) >= 50;/;

const replacement = `// 3. Trust the backend's matchScore for District, State, and Locality.
        // The backend might match Malayalam "കോഴിക്കോട് ജില്ല" with English "Kozhikode".
        // If the backend gave it a score of 50 or higher, we allow it to be displayed.
        return (item.matchScore || 0) >= 50;`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Failed to match regex");
}
