const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/backend/routes/buyRequirementRoutes.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Update INSERT query
content = content.replace(
  `buyer_status, enquiry_source, other_enquiry_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *;`,
  `buyer_status, enquiry_source, other_enquiry_source, interested_property_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING *;`
);

// Add to values array for insert
const valuesReplace = `        req.body.status || 'Active',
        finalLat,
        finalLng,
        finalPreferredCoords,
        req.body.buyerStatus || 'Hot (Willing to buy)',
        req.body.enquirySource || 'Phone Call',
        req.body.otherEnquirySource || ''
      ];`;
const newValues = `        req.body.status || 'Active',
        finalLat,
        finalLng,
        finalPreferredCoords,
        req.body.buyerStatus || 'Hot (Willing to buy)',
        req.body.enquirySource || 'Phone Call',
        req.body.otherEnquirySource || '',
        req.body.interestedPropertyId || null
      ];`;
content = content.replace(valuesReplace, newValues);


// 2. Update UPDATE query logic
content = content.replace(
  `const updatedOtherEnquirySource = req.body.otherEnquirySource !== undefined ? req.body.otherEnquirySource : current.other_enquiry_source;`,
  `const updatedOtherEnquirySource = req.body.otherEnquirySource !== undefined ? req.body.otherEnquirySource : current.other_enquiry_source;
      const updatedInterestedPropertyId = req.body.interestedPropertyId !== undefined ? req.body.interestedPropertyId : current.interested_property_id;`
);

content = content.replace(
  `buyer_status = $19,
          enquiry_source = $20,
          other_enquiry_source = $21,
          updated_at = NOW()
        WHERE id = $22`,
  `buyer_status = $19,
          enquiry_source = $20,
          other_enquiry_source = $21,
          interested_property_id = $22,
          updated_at = NOW()
        WHERE id = $23`
);

content = content.replace(
  `updatedEnquirySource,
        updatedOtherEnquirySource,
        req.params.id
      ];`,
  `updatedEnquirySource,
        updatedOtherEnquirySource,
        updatedInterestedPropertyId,
        req.params.id
      ];`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated buyRequirementRoutes.js");
