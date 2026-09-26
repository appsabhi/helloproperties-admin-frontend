const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// Update SchemaForm call for addRequirement
content = content.replace(
  /schema=\{buyRequirementSchema\}/,
  `schema={buyRequirementSchema.map(f => f.id === 'interestedPropertyId' ? { ...f, options: properties.map(p => ({ label: \`\${p.propertyId} - \${p.title}\`, value: p.id })) } : f)}`
);

// Update EditRequirement initial state payload
content = content.replace(
  /otherEnquirySource: editReqForm\.otherEnquirySource\s*\};/,
  `otherEnquirySource: editReqForm.otherEnquirySource,
      interestedPropertyId: editReqForm.interestedPropertyId || null
    };`
);

// Update setEditReqForm to include interestedPropertyId
content = content.replace(
  /otherEnquirySource: req\.otherEnquirySource \|\| '',/,
  `otherEnquirySource: req.otherEnquirySource || '',
      interestedPropertyId: req.interestedPropertyId || '',`
);

// Add select dropdown in edit form UI
const dropdownHtml = `
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[14px] font-medium text-slate-800 flex items-center">
                    Interested Property <span className="text-slate-400 ml-1 text-[11px] font-normal">(Optional)</span>
                  </label>
                  <select
                    value={editReqForm.interestedPropertyId || ''}
                    onChange={(e) => setEditReqForm({ ...editReqForm, interestedPropertyId: e.target.value })}
                    className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F] cursor-pointer"
                  >
                    <option value="">Select a property</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.propertyId} - {p.title}</option>
                    ))}
                  </select>
                </div>
`;

content = content.replace(
  /(<div className="flex flex-col space-y-1\.5">\s*<label className="text-\[14px\] font-medium text-slate-800">\s*Property Type)/,
  dropdownHtml + '\n                $1'
);


fs.writeFileSync(path, content, 'utf8');
console.log("Updated Properties.jsx");
