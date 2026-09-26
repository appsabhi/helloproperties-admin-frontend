const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

const endModalRegex = /\s*<\/Modal>\s*\)\}\s*\{\/\* SHARE PROPERTY MODAL/;
const replacementEnd = `
              </div>
            </div>
          </div>
        )}

        {/* SHARE PROPERTY MODAL`;
        
content = content.replace(endModalRegex, replacementEnd);

// Also replace setViewingDetailTarget(null) in the action buttons 
content = content.replace(
  /onClick=\{\(\) => setViewingDetailTarget\(null\)\}\s*className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"/,
  `onClick={() => navigate(viewingDetailTarget.type === 'requirement' ? '/properties/requirements' : '/properties/listings')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"`
);

// We should also replace the button label from "Close" to "Back"
content = content.replace(
  /className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"\s*>\s*Close\s*<\/button>/,
  `className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Back
                  </button>`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed closing Modal tag");
