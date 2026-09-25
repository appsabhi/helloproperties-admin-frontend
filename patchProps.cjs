const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `{matchItem.distanceKm != null ? (
                          <>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">
                                Nearest: {matchItem.nearestLocationName || (activeMatchTarget.type === 'property' ? matchItem.preferredLocation : matchItem.location)}
                              </span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                              <span className="font-bold">??</span>
                              <span className="font-semibold">Distance: {matchItem.distanceKm.toFixed(2)} km</span>
                            </div>
                          </>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                             {activeMatchTarget.type === 'property' ? \`\${matchItem.preferredLocation}, \${matchItem.district}\` : \`\${matchItem.location}, \${matchItem.district}\`}
                            </span>
                          </div>
                        )}`;

content = content.replace(
  /<div className="inline-flex items-center gap-1\.5 px-2\.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">\s*<MapPin className="w-3\.5 h-3\.5 text-slate-400 shrink-0" \/>\s*<span className="truncate">\s*\{activeMatchTarget\.type === 'property' \? `\$\{matchItem\.preferredLocation\}, \$\{matchItem\.district\}` : `\$\{matchItem\.location\}, \$\{matchItem\.district\}`\}\s*<\/span>\s*<\/div>/g,
  replacement
);

fs.writeFileSync(path, content);
console.log('done');
