const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<div className="text-right shrink-0 flex flex-col items-end">\s*<span className="text-\[10px\] text-slate-400 block font-semibold uppercase tracking-wider \n?.*?mb-0\.5">/m;

// Note: Using a slightly looser regex since the source code has a newline in the class name or between elements
const betterRegex = /<div className="text-right shrink-0 flex flex-col items-end">\s*<span className="text-\[10px\] text-slate-400 block font-semibold uppercase tracking-wider[\s\S]*?mb-0\.5">/;

const replacement = `<div className="text-right shrink-0 flex flex-col items-end">
                          {(matchItem.createdAt || matchItem.created_at) && (
                            <span className="text-[9px] text-slate-400/80 font-medium mb-1 tracking-wide">
                              Added {new Date(matchItem.createdAt || matchItem.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider mb-0.5">`;

if (betterRegex.test(content)) {
  content = content.replace(betterRegex, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Failed to match regex");
}
