const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/context/PropertyContext.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /otherEnquirySource: r\.otherEnquirySource \|\| r\.other_enquiry_source \|\| '',\s*status: r\.status \|\| 'Active',/,
  `otherEnquirySource: r.otherEnquirySource || r.other_enquiry_source || '',
      interestedPropertyId: r.interestedPropertyId || r.interested_property_id || null,
      status: r.status || 'Active',`
);

content = content.replace(
  /otherEnquirySource: reqData\.otherEnquirySource \|\| '',\s*status: reqData\.status \|\| 'Active',/,
  `otherEnquirySource: reqData.otherEnquirySource || '',
          interestedPropertyId: reqData.interestedPropertyId || null,
          status: reqData.status || 'Active',`
);

content = content.replace(
  /otherEnquirySource: updatedData\.otherEnquirySource \|\| '',\s*status: updatedData\.status \|\| 'Active',/,
  `otherEnquirySource: updatedData.otherEnquirySource || '',
          interestedPropertyId: updatedData.interestedPropertyId || null,
          status: updatedData.status || 'Active',`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated PropertyContext.jsx");
