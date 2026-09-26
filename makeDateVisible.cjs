const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<span className="text-\[9px\] text-slate-400\/80 font-medium mb-1 tracking-wide">/g,
  '<span className="text-[10px] text-slate-500 font-semibold mb-1 bg-slate-100 px-1.5 py-0.5 rounded">'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Success");
