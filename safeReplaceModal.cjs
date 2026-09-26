const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// Hide lists
content = content.replace(
  /\{view === 'list' && \(/g,
  `{view === 'list' && !viewingDetailTarget && (`
);

content = content.replace(
  /\{view === 'list' && \(\s*<div className="flex flex-wrap items-center gap-2">/g,
  `{view === 'list' && !viewingDetailTarget && (\n            <div className="flex flex-wrap items-center gap-2">`
);

// Find the start index of viewingDetailTarget Modal
let startIdx = content.indexOf("{/* FULL DETAILS POPUP MODAL */}");
if (startIdx === -1) {
  console.log("Error: Start string not found");
  process.exit(1);
}

// Find footer={
const footerMatch = content.substring(startIdx).match(/footer=\{/);
if (!footerMatch) {
  console.log("Error: Footer not found");
  process.exit(1);
}
let footerStartIdx = startIdx + footerMatch.index;

// Balance brackets to find the end of footer
let footerEndIdx = -1;
let openBrackets = 0;
for (let i = footerStartIdx + "footer={".length - 1; i < content.length; i++) {
  if (content[i] === '{') openBrackets++;
  else if (content[i] === '}') {
    openBrackets--;
    if (openBrackets === 0) {
      footerEndIdx = i; // points to closing }
      break;
    }
  }
}

if (footerEndIdx === -1) {
  console.log("Error: footerEndIdx not found");
  process.exit(1);
}

const footerContent = content.substring(footerStartIdx + "footer={".length, footerEndIdx);

// Find the end of the <Modal opening tag
const modalTagEndIdx = content.indexOf(">", footerEndIdx);
if (modalTagEndIdx === -1) {
  console.log("Error: Modal tag end not found");
  process.exit(1);
}

const endModalRegex = /<\/Modal>\s*\)\}\s*\{\/\* EDIT PROPERTY MODAL \*\/\}/;
const matchEnd = content.match(endModalRegex);
if (!matchEnd) {
  console.log("Error: endModalRegex not found");
  process.exit(1);
}
const modalCloseIdx = matchEnd.index;

const modalBody = content.substring(modalTagEndIdx + 1, modalCloseIdx);

const newContentStr = `        {/* FULL DETAILS DEDICATED VIEW */}
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
${modalBody}
              </div>
              
              {/* FOOTER ACTIONS */}
              <div className="p-5 bg-slate-50 border-t border-slate-100">
                ${footerContent}
              </div>
            </div>
          </div>
        )}

        {/* EDIT PROPERTY MODAL */}`;


let finalContent = content.substring(0, startIdx) + newContentStr + content.substring(modalCloseIdx + matchEnd[0].length - "{/* EDIT PROPERTY MODAL */}".length);


// Remove setViewingDetailTarget(null); from action buttons inside the replaced content
finalContent = finalContent.replace(
  /const target = viewingDetailTarget;\s*setViewingDetailTarget\(null\);\s*handleOpenMatches\(target\.type, target\.item\);/g,
  `const target = viewingDetailTarget;
                      handleOpenMatches(target.type, target.item);`
);

finalContent = finalContent.replace(
  /const target = viewingDetailTarget;\s*setViewingDetailTarget\(null\);\s*if \(target\.type === 'property'\) \{/g,
  `const target = viewingDetailTarget;
                      if (target.type === 'property') {`
);

finalContent = finalContent.replace(
  /const target = viewingDetailTarget;\s*setViewingDetailTarget\(null\);\s*setDeletingTarget\(\{ type: target\.type, item: target\.item \}\);/g,
  `const target = viewingDetailTarget;
                      setDeletingTarget({ type: target.type, item: target.item });`
);

finalContent = finalContent.replace(
  /const propObj = viewingDetailTarget\.item;\s*setViewingDetailTarget\(null\);\s*setSharingTarget\(\{ property: propObj, buyer: null \}\);/g,
  `const propObj = viewingDetailTarget.item;
                      setSharingTarget({ property: propObj, buyer: null });`
);

finalContent = finalContent.replace(
  /onClick=\{\(\) => setViewingDetailTarget\(null\)\}\s*className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"\s*>\s*Close\s*<\/button>/,
  `onClick={() => navigate(viewingDetailTarget.type === 'requirement' ? '/properties/requirements' : '/properties/listings')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Back to List
                </button>`
);

fs.writeFileSync(path, finalContent, 'utf8');
console.log("Successfully replaced Modal with full page!");
