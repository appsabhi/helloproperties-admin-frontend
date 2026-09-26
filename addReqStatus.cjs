const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<span className=\{\`inline-flex items-center px-2\.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider \$\{\s*req\.requirementType === 'Rent'\s*\?\s*'bg-violet-50 text-violet-700 border border-violet-100'\s*:\s*'bg-rose-50 text-\[#B0004F\] border border-rose-100'\s*\}\`\}>\s*\{req\.requirementType === 'Rent' \? 'Rent' : 'Buy'\}\s*<\/span>/;

const replacement = `<div className="flex items-center gap-1.5 shrink-0">
                          <span className={\`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider \${
                            req.requirementType === 'Rent'
                              ? 'bg-violet-50 text-violet-700 border border-violet-100'
                              : 'bg-rose-50 text-[#B0004F] border border-rose-100'
                          }\`}>
                            {req.requirementType === 'Rent' ? 'Rent' : 'Buy'}
                          </span>
                          {req.status && (
                            <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border \${
                              req.status === 'Available' || req.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : req.status === 'Under Negotiation'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }\`}>
                              {req.status}
                            </span>
                          )}
                        </div>`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Failed to match regex");
}
