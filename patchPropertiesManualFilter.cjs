const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace handleApplyManualFilter
const handleApplyRegex = /const handleApplyManualFilter = \(customForm\) => \{[\s\S]*?setMatchResults\(matches\);\n      \}\n    \};/;
const handleApplyReplacement = `const handleApplyManualFilter = async (customForm) => {
      if (!activeMatchTarget) return;
      const isPropTarget = activeMatchTarget.type === 'property';
      const isRent = customForm.listingType === 'Rent';
  
      const areaCombined = customForm.area ? \`\${customForm.area} \${customForm.areaUnit || 'Cent'}\` : '';
      
      setIsLoadingMatches(true);
      if (isPropTarget) {
        // Searching for matching requirements (buyers) using custom matching endpoint
        const mockProp = {
          listingType: customForm.listingType,
          district: customForm.district,
          location: customForm.location,
          propertyType: customForm.propertyType,
          expectedPrice: isRent ? 0 : Number(customForm.price || 0),
          monthlyRent: isRent ? Number(customForm.price || 0) : 0,
          area: areaCombined,
          state: activeMatchTarget.data?.state || 'Kerala',
          preferred_coordinates: customForm.preferred_coordinates || []
        };
  
        const results = await getCustomPropertyMatches(mockProp, customForm.minScore || 50);
        setMatchResults(results || []);
      } else {
        // Searching for matching properties using custom matching endpoint
        const mockReq = {
          requirementType: customForm.listingType,
          district: customForm.district,
          preferredLocation: customForm.location,
          propertyType: customForm.propertyType,
          budget: isRent ? 0 : Number(customForm.price || 0),
          maximumMonthlyRent: isRent ? Number(customForm.price || 0) : 0,
          requiredArea: areaCombined,
          state: activeMatchTarget.data?.state || 'Kerala',
          preferred_coordinates: customForm.preferred_coordinates || []
        };
  
        const results = await getCustomRequirementMatches(mockReq, customForm.minScore || 50);
        setMatchResults(results || []);
      }
      setIsLoadingMatches(false);
    };`;

content = content.replace(handleApplyRegex, handleApplyReplacement);

// 2. Replace Location input with LocationSelector
const locationInputRegex = /\{\/\* Location \/ Locality \*\/\}[\s\S]*?<\/div>/;
const locationInputReplacement = `{/* Location / Locality */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Location / Locality</label>
                      <LocationSelector
                        formData={manualFilterForm}
                        locationFieldName="location"
                        allowMultiple={true}
                        onChange={(updateObj) => {
                          const updated = { ...manualFilterForm, ...updateObj };
                          setManualFilterForm(updated);
                        }}
                      />
                    </div>`;
                    
content = content.replace(locationInputRegex, locationInputReplacement);

fs.writeFileSync(path, content);
console.log('done');
