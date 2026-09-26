const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{\(matchItem\.createdAt \|\| matchItem\.created_at\) && \([\s\S]*?Added \{new Date\(matchItem\.createdAt \|\| matchItem\.created_at\)\.toLocaleDateString\('en-GB', \{ day: '2-digit', month: 'short', year: 'numeric' \}\)\}[\s\S]*?<\/span>\s*\)\}/;

const replacement = `<span className="text-[10px] text-slate-500 font-semibold mb-1 bg-slate-100 px-1.5 py-0.5 rounded">
                                Added {matchItem.createdAt || matchItem.created_at ? new Date(matchItem.createdAt || matchItem.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date'}
                              </span>`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Failed to match regex");
}
