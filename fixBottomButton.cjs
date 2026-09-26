const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// The footerContent inside safeReplaceModal.cjs brought the "Close" button over.
// Let's replace setViewingDetailTarget(null) in the Close button.
content = content.replace(
  /onClick=\{\(\) => setViewingDetailTarget\(null\)\}\s*className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"\s*>\s*Close\s*<\/button>/,
  `onClick={() => navigate(viewingDetailTarget.type === 'requirement' ? '/properties/requirements' : '/properties/listings')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Back to List
                </button>`
);

// We should also replace the button label from "Close" to "Back" anywhere else just in case.

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed bottom action button");
