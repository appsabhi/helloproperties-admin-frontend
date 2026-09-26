const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

const mapPinTarget = /<div className="flex flex-wrap gap-1 items-center">\s*\{\(viewingDetailTarget\.type === 'property'[\s\S]*?:\s*null\)\}\s*<\/div>/;

const mapPinReplacement = `<div>
                    {viewingDetailTarget.type === 'property' ? (
                      <span>
                        {viewingDetailTarget.item.location}
                        {(viewingDetailTarget.item.district || viewingDetailTarget.item.state) && (
                          <span className="ml-1">
                            {viewingDetailTarget.item.district ? \`, \${viewingDetailTarget.item.district}\` : ''}
                            {viewingDetailTarget.item.state ? \`, \${viewingDetailTarget.item.state}\` : ''}
                          </span>
                        )}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1 items-center">
                        {(viewingDetailTarget.item.preferredLocation)?.split(',').map((loc, i) => loc.trim() ? (
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
                    )}
                  </div>`;

content = content.replace(mapPinTarget, mapPinReplacement);

const gridLocationTarget = /<div className="flex flex-wrap gap-1 mt-1">\s*\{\(viewingDetailTarget\.type === 'property'[\s\S]*?\|\|\s*<span className="text-xs font-bold text-slate-800">—<\/span>\}\s*<\/div>/;

const gridLocationReplacement = `<div>
                  {viewingDetailTarget.type === 'property' ? (
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                      {viewingDetailTarget.item.location || '—'}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(viewingDetailTarget.item.preferredLocation)?.split(',').map((loc, i) => loc.trim() ? (
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
                  )}
                </div>`;

content = content.replace(gridLocationTarget, gridLocationReplacement);

fs.writeFileSync(path, content, 'utf8');
