const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<div key=\{idx\} className="bg-white rounded-2xl border border-slate-200\/80 p-5 shadow-\[0_2px_8px_-2px_rgba\(0,0,0,0\.04\)\] hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-3\.5">/;

const replacement = `<div 
                      key={idx} 
                      onClick={() => {
                        setViewingDetailTarget({ 
                          type: activeMatchTarget.type === 'property' ? 'requirement' : 'property', 
                          item: matchItem 
                        });
                      }}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-3.5 cursor-pointer"
                    >`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Failed to match regex");
}
