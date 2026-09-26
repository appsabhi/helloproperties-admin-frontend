const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// MapPin
content = content.replace(
  /<div className="flex items-center gap-1\.5 mt-1 text-xs text-slate-500">\s*<MapPin className="w-3\.5 h-3\.5 text-slate-400 shrink-0" \/>\s*<span>\s*\{viewingDetailTarget\.type === 'property'[\s\S]*?<\/span>\s*<\/div>/g,
  `<div className="flex items-start gap-1.5 mt-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1 items-center">
                    {(viewingDetailTarget.type === 'property'
                      ? viewingDetailTarget.item.location
                      : viewingDetailTarget.item.preferredLocation)?.split(',').map((loc, i) => loc.trim() ? (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {loc.trim()}
                          {(viewingDetailTarget.item.district || viewingDetailTarget.item.state) && (
                            <span className="font-normal text-slate-500 ml-1">
                              {viewingDetailTarget.item.district ? \`, \${viewingDetailTarget.item.district}\` : ''}
                              {viewingDetailTarget.item.state ? \`, \${viewingDetailTarget.item.state}\` : ''}
                            </span>
                          )}
                        </span>
                    ) : null)}
                  </div>
                </div>`
);

// Location / City
content = content.replace(
  /<div className="p-2\.5 rounded-xl bg-slate-50 border border-slate-100">\s*<span className="text-\[10px\] font-semibold text-slate-400 uppercase tracking-wider block">Location \/ City<\/span>\s*<span className="text-xs font-bold text-slate-800 mt-0\.5 block truncate">\s*\{viewingDetailTarget\.type === 'property' \? viewingDetailTarget\.item\.location : viewingDetailTarget\.item\.preferredLocation\}\s*<\/span>\s*<\/div>/g,
  `<div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2 lg:col-span-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Location / City</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(viewingDetailTarget.type === 'property' ? viewingDetailTarget.item.location : viewingDetailTarget.item.preferredLocation)?.split(',').map((loc, i) => loc.trim() ? (
                    <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200/70 text-slate-700">
                      {loc.trim()}
                      {(viewingDetailTarget.item.district || viewingDetailTarget.item.state) && (
                        <span className="font-normal text-slate-500 ml-1">
                          {viewingDetailTarget.item.district ? \`, \${viewingDetailTarget.item.district}\` : ''}
                          {viewingDetailTarget.item.state ? \`, \${viewingDetailTarget.item.state}\` : ''}
                        </span>
                      )}
                    </span>
                  ) : null) || <span className="text-xs font-bold text-slate-800">—</span>}
                </div>
              </div>`
);

// Remove Subtitle
content = content.replace(
  /subtitle=\{viewingDetailTarget\.type === 'property'[\s\S]*? \: ''\}`\}/,
  ``
);

fs.writeFileSync(path, content, 'utf8');
