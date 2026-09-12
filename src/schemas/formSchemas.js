export const sellPropertySchema = [
  { id: 'listingType', label: 'Listing Type', type: 'select', options: ['Sale', 'Rent'], defaultValue: 'Sale', required: true },
  { id: 'title', label: 'Property Title', type: 'text', placeholder: 'e.g. 2 Acre Farmland near Main Road', required: true },
  { id: 'propertyType', label: 'Property Type', type: 'select', options: ['Plot/Land', 'Commercial Plot', 'Agricultural Land', 'Residential Plot', 'House/Villa', 'Industrial Plot'], defaultValue: 'Plot/Land', required: true },
  { id: 'locationSelector', label: 'Location & Region Selection', type: 'location_selector', locationFieldName: 'location', required: true },
  { id: 'area', label: 'Area', type: 'text', placeholder: 'e.g. 2400 sq ft or 1.5 acres', required: true },
  { id: 'expectedPrice', label: 'Expected Price (₹)', type: 'number', placeholder: 'e.g. 3500000', required: true, showIf: (data) => data.listingType === 'Sale' },
  { id: 'monthlyRent', label: 'Monthly Rent (₹)', type: 'number', placeholder: 'e.g. 18000', required: true, showIf: (data) => data.listingType === 'Rent' },
  { id: 'securityDeposit', label: 'Security Deposit (₹)', type: 'number', placeholder: 'e.g. 100000', required: true, showIf: (data) => data.listingType === 'Rent' },
  { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Add key features, road access details, soil type, etc.', required: false },
  { id: 'ownerName', label: 'Owner Name', type: 'text', placeholder: 'e.g. Ramesh Krishnan', required: true },
  { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: 'e.g. 9876543210', required: true },
  { id: 'ownerAddress', label: 'Owner Address', type: 'textarea', placeholder: "Owner's residential address", required: false },
  { id: 'images', label: 'Property Images', type: 'image', required: false }
];

export const buyRequirementSchema = [
  { id: 'requirementType', label: 'Requirement Type', type: 'select', options: ['Buy', 'Rent'], defaultValue: 'Buy', required: true },
  { id: 'requirementTitle', label: 'Requirement Title', type: 'text', placeholder: 'e.g. Warehouse Site Requirement', required: false },
  { id: 'propertyType', label: 'Property Type Required', type: 'select', options: ['Plot/Land', 'Commercial Plot', 'Agricultural Land', 'Residential Plot', 'House/Villa', 'Industrial Plot'], defaultValue: 'Plot/Land', required: true },
  { id: 'locationSelector', label: 'Location & Region Selection', type: 'location_selector', locationFieldName: 'preferredLocation', required: true },
  { id: 'requiredArea', label: 'Required Area', type: 'text', placeholder: 'e.g. Min 5000 sq ft or 5-15 Acres', required: true },
  { id: 'budget', label: 'Max Purchase Budget (₹)', type: 'number', placeholder: 'e.g. 7500000', required: true, showIf: (data) => data.requirementType === 'Buy' },
  { id: 'maximumMonthlyRent', label: 'Maximum Monthly Rent (₹)', type: 'number', placeholder: 'e.g. 20000', required: true, showIf: (data) => data.requirementType === 'Rent' },
  { id: 'description', label: 'Description / Remarks', type: 'textarea', placeholder: 'Specific details (e.g. corner plot, clear titles required)', required: false },
  { id: 'buyerName', label: 'Buyer Name', type: 'text', placeholder: 'e.g. Suresh Nair', required: true },
  { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: 'e.g. 9123456789', required: true },
  { id: 'buyerAddress', label: 'Buyer Address', type: 'textarea', placeholder: "Buyer's residential/office address", required: false }
];
