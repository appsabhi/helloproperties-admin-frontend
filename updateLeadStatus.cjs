const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace the top req.status badge with req.buyerStatus badge
const topStatusRegex = /\{req\.status && \([\s\S]*?\{req\.status\}[\s\S]*?<\/span>\s*\)\}/;
const newTopBadge = `{req.buyerStatus && (
                              <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border \${
                                req.buyerStatus.toLowerCase().includes('hot') ? 'bg-green-50 text-green-700 border-green-200' :
                                req.buyerStatus.toLowerCase().includes('cold') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                req.buyerStatus.toLowerCase().includes('mild') ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                              }\`}>
                                {req.buyerStatus.split(' (')[0]} Lead
                              </span>
                            )}`;

if (topStatusRegex.test(content)) {
  content = content.replace(topStatusRegex, newTopBadge);
  console.log("Successfully replaced top badge.");
} else {
  console.log("Failed to match top badge regex.");
}

// 2. Remove the bottom req.buyerStatus badge
const bottomBadgeRegex = /\{req\.buyerStatus && \(\s*<div className=\{\`inline-flex items-center gap-1\.5 px-2\.5 py-1 rounded-lg border text-\[11px\] font-semibold max-w-full \$\{[\s\S]*?<\/div>\s*\)\}/;
if (bottomBadgeRegex.test(content)) {
  content = content.replace(bottomBadgeRegex, '');
  console.log("Successfully removed bottom badge.");
} else {
  console.log("Failed to match bottom badge regex.");
}

fs.writeFileSync(path, content, 'utf8');
