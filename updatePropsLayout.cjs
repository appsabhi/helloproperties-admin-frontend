const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Hide the Filters Panel and Grid List when viewing detail
content = content.replace(
  /\{view === 'list' && \(/g,
  `{view === 'list' && !viewingDetailTarget && (`
);

// 2. Hide the Primary Action Button row when viewing detail
content = content.replace(
  /\{view === 'list' && \(\s*<div className="flex flex-wrap items-center gap-2">/g,
  `{view === 'list' && !viewingDetailTarget && (\n            <div className="flex flex-wrap items-center gap-2">`
);

// 3. Replace the Modal wrapper for viewingDetailTarget with a full-page div
// We need to parse the Modal carefully.
// The Modal starts with:
//         {viewingDetailTarget && (
//           <Modal
//             isOpen={!!viewingDetailTarget}
//             ...
//             footer={ ... }
//           >
//             {/* Media Container: Image or Video */}

const startModalRegex = /\{\/\* FULL DETAILS POPUP MODAL \*\/\}\s*\{viewingDetailTarget && \(\s*<Modal\s+isOpen=\{\!\!viewingDetailTarget\}\s+onClose=\{\(\) => setViewingDetailTarget\(null\)\}\s+title=\{[\s\S]*?icon=\{Building2\}\s+badge=\{[\s\S]*?\}\s+size="2xl"\s+footer=\{([\s\S]*?)\}\s*>/;

const match = content.match(startModalRegex);
if (match) {
  const footerContent = match[1];
  
  const replacementStart = `
        {/* FULL DETAILS DEDICATED VIEW */}
        {viewingDetailTarget && (
          <div className="flex-1 overflow-y-auto bg-[#F7F7F7] p-4 sm:p-6 lg:p-8">
            <div className="max-w-[900px] mx-auto bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
              
              {/* HEADER AREA */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#B0004F]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#B0004F]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {viewingDetailTarget.type === 'property'
                        ? viewingDetailTarget.item.title
                        : (viewingDetailTarget.item.requirementTitle || \`\${viewingDetailTarget.item.propertyType} Requirement\`)}
                    </h2>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider \${
                        (viewingDetailTarget.item.requirementType === 'Rent' || viewingDetailTarget.item.listingType === 'Rent')
                          ? 'bg-violet-50 text-violet-700 border border-violet-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }\`}>
                        {viewingDetailTarget.type === 'property'
                          ? (viewingDetailTarget.item.listingType || 'Sale')
                          : (viewingDetailTarget.item.requirementType === 'Rent' ? 'Rent Requirement' : 'Buy Requirement')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(viewingDetailTarget.type === 'requirement' ? '/properties/requirements' : '/properties/listings')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Back to List
                  </button>
                </div>
              </div>

              {/* BODY CONTENT */}
              <div className="p-5 sm:p-7 space-y-6">
  `;

  content = content.replace(startModalRegex, replacementStart);

  // Now we need to find the closing </Modal> for viewingDetailTarget and replace it with 
  // the footer content + closing divs.
  // We'll search for the </Modal> that comes right before {/* EDIT PROPERTY MODAL */}
  
  const endModalRegex = /\s*<\/Modal>\s*\)\}\s*\{\/\* EDIT PROPERTY MODAL \*\/\}/;
  const replacementEnd = `
              </div>
              
              {/* FOOTER ACTIONS */}
              <div className="p-5 bg-slate-50 border-t border-slate-100">
                ${footerContent}
              </div>
            </div>
          </div>
        )}

        {/* EDIT PROPERTY MODAL */}`;
        
  content = content.replace(endModalRegex, replacementEnd);
}

fs.writeFileSync(path, content, 'utf8');
console.log("Updated Properties layout for full page details");
