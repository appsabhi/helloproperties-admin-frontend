const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix initFilter
const initFilterTarget = `    const isRent = ((item?.listingType || item?.requirementType) || '').toLowerCase() === 'rent';
    const priceVal = item?.expectedPrice || item?.monthlyRent || item?.budget || item?.maximumMonthlyRent || '';
    const initFilter = {
      listingType: isRent ? 'Rent' : 'Sale',
      district: item?.district || '',
      location: item?.location || item?.preferredLocation || '',
      propertyType: item?.propertyType || '',
      price: priceVal || '',
      area: item?.area || item?.requiredArea || '',
      areaUnit: 'Cent',
      minScore: 50
    };
    setManualFilterForm(initFilter);`;

const initFilterReplacement = `    const isRent = ((item?.listingType || item?.requirementType) || '').toLowerCase() === 'rent';
    const priceVal = item?.expectedPrice || item?.monthlyRent || item?.budget || item?.maximumMonthlyRent || '';
    
    let initArea = item?.area || item?.requiredArea || '';
    let initAreaUnit = 'Cent';
    if (initArea) {
      const match = String(initArea).match(/^([\\d.]+)\\s*(.*)$/);
      if (match) {
        initArea = match[1];
        if (match[2]) initAreaUnit = match[2].trim();
      }
    }

    const initFilter = {
      listingType: isRent ? 'Rent' : 'Sale',
      district: item?.district || '',
      location: item?.location || item?.preferredLocation || '',
      propertyType: item?.propertyType || '',
      price: priceVal || '',
      area: initArea,
      areaUnit: initAreaUnit,
      minScore: 50
    };
    setManualFilterForm(initFilter);`;

content = content.replace(initFilterTarget, initFilterReplacement);

// 2. Fix resetForm
const resetFormTarget = `                          const isRent = ((activeMatchTarget.data?.listingType || activeMatchTarget.data?.requirementType) || '').toLowerCase() === 'rent';
                          const priceVal = activeMatchTarget.data?.expectedPrice || activeMatchTarget.data?.monthlyRent || activeMatchTarget.data?.budget || activeMatchTarget.data?.maximumMonthlyRent || '';
                          const resetForm = {
                            listingType: isRent ? 'Rent' : 'Sale',
                            district: activeMatchTarget.data?.district || '',
                            location: activeMatchTarget.data?.location || activeMatchTarget.data?.preferredLocation || '',
                            propertyType: activeMatchTarget.data?.propertyType || '',
                            price: priceVal || '',
                            area: activeMatchTarget.data?.area || activeMatchTarget.data?.requiredArea || '',
                            areaUnit: 'Cent',
                            minScore: 50
                          };
                          setManualFilterForm(resetForm);
                          handleApplyManualFilter(resetForm);`;

const resetFormReplacement = `                          const isRent = ((activeMatchTarget.data?.listingType || activeMatchTarget.data?.requirementType) || '').toLowerCase() === 'rent';
                          const priceVal = activeMatchTarget.data?.expectedPrice || activeMatchTarget.data?.monthlyRent || activeMatchTarget.data?.budget || activeMatchTarget.data?.maximumMonthlyRent || '';
                          
                          let resetInitArea = activeMatchTarget.data?.area || activeMatchTarget.data?.requiredArea || '';
                          let resetInitAreaUnit = 'Cent';
                          if (resetInitArea) {
                            const match = String(resetInitArea).match(/^([\\d.]+)\\s*(.*)$/);
                            if (match) {
                              resetInitArea = match[1];
                              if (match[2]) resetInitAreaUnit = match[2].trim();
                            }
                          }

                          const resetForm = {
                            listingType: isRent ? 'Rent' : 'Sale',
                            district: activeMatchTarget.data?.district || '',
                            location: activeMatchTarget.data?.location || activeMatchTarget.data?.preferredLocation || '',
                            propertyType: activeMatchTarget.data?.propertyType || '',
                            price: priceVal || '',
                            area: resetInitArea,
                            areaUnit: resetInitAreaUnit,
                            minScore: 50
                          };
                          setManualFilterForm(resetForm);
                          handleApplyManualFilter(resetForm);`;

content = content.replace(resetFormTarget, resetFormReplacement);

// 3. Remove subtitle from Modal completely (from earlier)
const subtitleRegex = /title=\{viewingDetailTarget\.type === 'property'\s*\?\s*viewingDetailTarget\.item\.title\s*:\s*\(viewingDetailTarget\.item\.requirementTitle \|\| `\$\{viewingDetailTarget\.item\.propertyType\} Requirement`\)\}\s*subtitle=\{viewingDetailTarget\.type === 'property'\s*\?\s*`\$\{viewingDetailTarget\.item\.location\}, \$\{viewingDetailTarget\.item\.district\}\$\{viewingDetailTarget\.item\.state \? `, \$\{viewingDetailTarget\.item\.state\}` : ''\}`\s*:\s*`\$\{viewingDetailTarget\.item\.preferredLocation\}, \$\{viewingDetailTarget\.item\.district\}\$\{viewingDetailTarget\.item\.state \? `, \$\{viewingDetailTarget\.item\.state\}` : ''\}`\}/;

const subtitleReplacement = `title={viewingDetailTarget.type === 'property'
            ? viewingDetailTarget.item.title
            : (viewingDetailTarget.item.requirementTitle || \`\${viewingDetailTarget.item.propertyType} Requirement\`)}`;

content = content.replace(subtitleRegex, subtitleReplacement);

// 4. Update MapPin display to use separated tags with appended address
const mapPinTarget = `<div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {viewingDetailTarget.type === 'property'
                      ? \`\${viewingDetailTarget.item.location}, \${viewingDetailTarget.item.district}\${viewingDetailTarget.item.state ? \`, \${viewingDetailTarget.item.state}\` : ''}\`
                      : \`\${viewingDetailTarget.item.preferredLocation}, \${viewingDetailTarget.item.district}\${viewingDetailTarget.item.state ? \`, \${viewingDetailTarget.item.state}\` : ''}\`}
                  </span>
                </div>`;

const mapPinReplacement = `<div className="flex items-start gap-1.5 mt-1.5 text-xs text-slate-500">
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
                </div>`;

content = content.replace(mapPinTarget, mapPinReplacement);

// 5. Update Location / City Grid block
const gridLocationTarget = `<div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Location / City</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                  {viewingDetailTarget.type === 'property' ? viewingDetailTarget.item.location : viewingDetailTarget.item.preferredLocation}
                </span>
              </div>`;

const gridLocationReplacement = `<div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2 lg:col-span-1">
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
              </div>`;

content = content.replace(gridLocationTarget, gridLocationReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log("All replacements applied safely.");
