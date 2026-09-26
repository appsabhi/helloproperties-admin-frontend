const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. initFilter fix
content = content.replace(
  /const initFilter = \{\s*listingType: isRent \? 'Rent' : 'Sale',\s*district: item\?\.district \|\| '',\s*location: item\?\.location \|\| item\?\.preferredLocation \|\| '',\s*propertyType: item\?\.propertyType \|\| '',\s*price: priceVal \|\| '',\s*area: item\?\.area \|\| item\?\.requiredArea \|\| '',\s*areaUnit: 'Cent',\s*minScore: 50\s*\};\s*setManualFilterForm\(initFilter\);/g,
  `let initArea = item?.area || item?.requiredArea || '';
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
    setManualFilterForm(initFilter);`
);

// 2. resetForm fix
content = content.replace(
  /const resetForm = \{\s*listingType: isRent \? 'Rent' : 'Sale',\s*district: activeMatchTarget\.data\?\.district \|\| '',\s*location: activeMatchTarget\.data\?\.location \|\| activeMatchTarget\.data\?\.preferredLocation \|\| '',\s*propertyType: activeMatchTarget\.data\?\.propertyType \|\| '',\s*price: priceVal \|\| '',\s*area: activeMatchTarget\.data\?\.area \|\| activeMatchTarget\.data\?\.requiredArea \|\| '',\s*areaUnit: 'Cent',\s*minScore: 50\s*\};\s*setManualFilterForm\(resetForm\);\s*handleApplyManualFilter\(resetForm\);/g,
  `let resetInitArea = activeMatchTarget.data?.area || activeMatchTarget.data?.requiredArea || '';
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
                          handleApplyManualFilter(resetForm);`
);

fs.writeFileSync(path, content, 'utf8');
