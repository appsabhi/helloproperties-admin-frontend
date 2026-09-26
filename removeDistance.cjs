const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<div className="inline-flex items-center gap-1\.5 px-2\.5 py-1 rounded-lg bg-emerald-50 \s*border border-emerald-200 text-xs text-emerald-700">\s*<span className="font-bold">[\s\S]*?<\/span>\s*<span className="font-semibold">Distance: \{matchItem\.distanceKm\.toFixed\(2\)\} km<\/span>\s*<\/div>/g;

if (regex.test(content)) {
  content = content.replace(regex, '');
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Failed to match regex");
}
