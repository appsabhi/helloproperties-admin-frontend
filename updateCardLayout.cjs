const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `{filteredRequirements.map(req => (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] hover:border-slate-300/80 transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Card Header: Type Badge, Property Type & Budget */}
                  <div className="flex items-center justify-between gap-3">
                    <div 
                      onClick={() => navigate(\`/requirements/\${req.id}\`)}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                      title="Click to view full requirement details"
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                          <span className={\`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider \${
                            req.requirementType === 'Rent'
                              ? 'bg-violet-50 text-violet-700 border border-violet-100'
                              : 'bg-rose-50 text-[#B0004F] border border-rose-100'
                          }\`}>
                            {req.requirementType === 'Rent' ? 'Rent' : 'Buy'}
                          </span>
                          {req.buyerStatus && (
                            <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border \${
                              req.buyerStatus.toLowerCase().includes('hot') ? 'bg-green-50 text-green-700 border-green-200' :
                              req.buyerStatus.toLowerCase().includes('cold') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              req.buyerStatus.toLowerCase().includes('mild') ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }\`}>
                              {req.buyerStatus.split(' (')[0]} Lead
                            </span>
                          )}
                        </div>
                      <h3 className="font-bold text-base sm:text-[17px] text-slate-900 tracking-tight truncate hover:text-[#B0004F] transition-colors">
                        {req.buyerName || req.requirementTitle || req.propertyType}
                      </h3>
                      {req.buyerName && (
                        <span className="text-sm font-medium text-slate-500 truncate">
                          ({req.propertyType})
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {req.createdAt && (
                        <span className="text-[10px] text-slate-400 font-semibold tracking-wide">
                          Added {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col items-end min-w-[110px] w-full">
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-0.5">
                        {req.requirementType === 'Rent' ? 'Max Rent' : 'Price / Budget'}
                      </span>
                      <span className="font-extrabold text-[17px] text-slate-900 tracking-tight block leading-none">
                        {req.requirementType === 'Rent' 
                          ? formatPrice(req.maximumMonthlyRent)
                          : formatPrice(req.budget)}
                      </span>
                      {(() => {
                        const unitText = getItemUnitText(req, 'requirement');
                        return unitText && unitText !== 'All Properties' ? (
                          <span className="mt-1.5 inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF1F6] text-[#B0004F]">
                            {unitText.startsWith('/') ? unitText : \`/ \${unitText}\`}
                          </span>
                        ) : null;
                      })()}
                      </div>
                    </div>
                  </div>

                  {/* Tags / Chips Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {(req.preferredLocation || '').split(',').map(l => l.trim()).filter(Boolean).map((loc, i) => (
                        <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 max-w-full">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{loc}, {req.district}{req.state ? \`, \${req.state}\` : ''}</span>
                        </div>
                      ))}
                    {req.requiredArea && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 max-w-full">
                        <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{formatDisplayArea(req.requiredArea, req.requiredAreaUnit)}</span>
                      </div>
                    )}

                    {req.enquirySource && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-700 max-w-full">
                        <span className="truncate">Src: {req.enquirySource === 'Other' ? req.otherEnquirySource : req.enquirySource}</span>
                      </div>
                    )}
                  </div>

                  {req.description && (
                    <div className="pt-2 text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
                      {req.description}
                    </div>
                  )}
                </div>

                {/* Bottom Action / Status Bar */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  

                  <div className="flex items-center gap-1.5 justify-start sm:justify-end">
                    <button
                      onClick={() => navigate(\`/requirements/\${req.id}\`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-all cursor-pointer"
                      title="View full requirement details in popup"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />

                      <span>View Details</span>
                    </button>

                    <button
                      onClick={() => handleOpenMatches('requirement', req)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-[#B0004F] hover:bg-[#B0004F] hover:text-white transition-all cursor-pointer"
                      title="View Matching Properties"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Matching Properties</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}`;

const newBlock = `{filteredRequirements.map(req => (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4">
                    {/* Title & Badges */}
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider \${
                          req.requirementType === 'Rent'
                            ? 'bg-violet-50 text-violet-700 border border-violet-100'
                            : 'bg-rose-50 text-[#B0004F] border border-rose-100'
                        }\`}>
                          {req.requirementType === 'Rent' ? 'Rent' : 'Buy'}
                        </span>
                        {req.buyerStatus && (
                          <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border \${
                            req.buyerStatus.toLowerCase().includes('hot') ? 'bg-green-50 text-green-700 border-green-200' :
                            req.buyerStatus.toLowerCase().includes('cold') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            req.buyerStatus.toLowerCase().includes('mild') ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }\`}>
                            {req.buyerStatus.split(' (')[0]} Lead
                          </span>
                        )}
                        {req.createdAt && (
                          <span className="text-[10px] text-slate-400 font-semibold tracking-wide ml-1">
                            Added {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <h3 
                        onClick={() => navigate(\`/requirements/\${req.id}\`)}
                        className="font-bold text-base sm:text-[18px] text-slate-900 tracking-tight truncate hover:text-[#B0004F] transition-colors cursor-pointer"
                        title="Click to view full requirement details"
                      >
                        {req.buyerName || req.requirementTitle || req.propertyType}
                        {req.buyerName && (
                          <span className="text-sm font-medium text-slate-500 ml-1.5">
                            ({req.propertyType})
                          </span>
                        )}
                      </h3>
                    </div>

                    {/* Price Box */}
                    <div className="flex flex-col items-end shrink-0 pt-0.5">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 sm:p-3 flex flex-col items-end min-w-[120px] shadow-sm">
                        <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-1">
                          {req.requirementType === 'Rent' ? 'Max Rent' : 'Price / Budget'}
                        </span>
                        <span className="font-extrabold text-[16px] sm:text-[18px] text-slate-900 tracking-tight block leading-none">
                          {req.requirementType === 'Rent' 
                            ? formatPrice(req.maximumMonthlyRent)
                            : formatPrice(req.budget)}
                        </span>
                        {(() => {
                          const unitText = getItemUnitText(req, 'requirement');
                          return unitText && unitText !== 'All Properties' ? (
                            <span className="mt-1.5 inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF1F6] text-[#B0004F]">
                              {unitText.startsWith('/') ? unitText : \`/ \${unitText}\`}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Tags / Chips Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(req.district || req.state) && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700">
                        <MapPin className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        <span>{req.district}{req.state ? \`, \${req.state}\` : ''}</span>
                      </div>
                    )}
                    {(req.preferredLocation || '').split(',').map(l => l.trim()).filter(Boolean).map((loc, i) => (
                        <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                          <span className="truncate">{loc}</span>
                        </div>
                      ))}
                    {req.requiredArea && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                        <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{formatDisplayArea(req.requiredArea, req.requiredAreaUnit)}</span>
                      </div>
                    )}
                    {req.enquirySource && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-700">
                        <span className="truncate">Src: {req.enquirySource === 'Other' ? req.otherEnquirySource : req.enquirySource}</span>
                      </div>
                    )}
                  </div>

                  {req.description && (
                    <div className="pt-2 text-[13px] text-slate-500 line-clamp-2 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      {req.description}
                    </div>
                  )}
                </div>

                {/* Bottom Action / Status Bar */}
                <div className="bg-slate-50/50 border-t border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-auto group-hover:bg-slate-50 transition-colors">
                  <div className="flex flex-wrap items-center gap-2.5 w-full">
                    <button
                      onClick={() => navigate(\`/requirements/\${req.id}\`)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] font-bold rounded-xl text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                      title="View full requirement details in popup"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>

                    <button
                      onClick={() => handleOpenMatches('requirement', req)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] font-bold rounded-xl bg-rose-50 border border-rose-100 text-[#B0004F] hover:bg-[#B0004F] hover:text-white transition-colors cursor-pointer"
                      title="View Matching Properties"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Matching Properties</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}`;

if (!content.includes(oldBlock.trim().substring(0, 50))) {
  console.log("Could not find the target block to replace.");
  process.exit(1);
}

const newContent = content.replace(oldBlock, newBlock);

if (newContent === content) {
  console.log("Replacement failed, exact string not matched.");
  process.exit(1);
}

fs.writeFileSync(path, newContent, 'utf8');
console.log("Successfully replaced requirement card style!");
