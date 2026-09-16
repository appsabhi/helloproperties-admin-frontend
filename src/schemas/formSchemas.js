export const sellPropertySchema = [
  { id: 'listingType', label: 'Listing Type', type: 'select', options: ['Sale', 'Rent'], defaultValue: 'Sale', required: true },
  { id: 'title', label: 'Property Title', type: 'text', placeholder: 'e.g. 3 BHK Modern Villa in Town', required: true },
  { id: 'propertyType', label: 'Property Type', type: 'select', options: ['Plot/Land', 'House/Villa', 'Residential Plot', 'Commercial Plot', 'Agricultural Land', 'Industrial Plot'], defaultValue: 'House/Villa', required: true },
  { id: 'locationSelector', label: 'Location & Region Selection', type: 'location_selector', locationFieldName: 'location', required: true },
  { id: 'area', label: 'Area / Size', type: 'text', placeholder: 'e.g. 45 or 3', required: true, hasUnit: true, unitId: 'areaUnit', unitOptions: ['Cent', 'Sq. Ft.', 'Acre', 'BHK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK', 'Sq. Meter', 'Sq. Yard'], defaultUnit: 'Cent' },
  { id: 'expectedPrice', label: 'Expected Price (₹)', type: 'number', placeholder: 'e.g. 1.8 or 50', required: true, showIf: (data) => data.listingType === 'Sale', hasUnit: true, unitId: 'expectedPriceUnit', unitOptions: ['/ Cent', '/ Sq. Ft.', '/ Acre', '/ Month', '/ BHK', '/ House', '/ Sq. Meter', '/ Sq. Yard', 'All Properties'], defaultUnit: '/ Cent', isPricePerArea: true },
  { id: 'monthlyRent', label: 'Rent (₹)', type: 'number', placeholder: 'e.g. 18000', required: true, showIf: (data) => data.listingType === 'Rent', hasUnit: true, unitId: 'monthlyRentUnit', unitOptions: ['/ Month', 'All Properties', '/ Sq. Ft.', '/ Cent', '/ Acre', '/ BHK', '/ House', '/ Sq. Meter', '/ Sq. Yard'], defaultUnit: '/ Month', isPricePerArea: true },
  { id: 'securityDeposit', label: 'Security Deposit (₹)', type: 'number', placeholder: 'e.g. 100000', required: false, showIf: () => false, hasUnit: true, unitId: 'securityDepositUnit', unitOptions: ['All Properties', 'Months'], defaultUnit: 'All Properties' },
  { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Add key features, road access details, soil type, etc.', required: false },
  { id: 'ownerName', label: 'Owner Name', type: 'text', placeholder: 'e.g. Ramesh Krishnan', required: true },
  { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: 'e.g. 9876543210', required: true },
  { id: 'ownerAddress', label: 'Owner Address', type: 'textarea', placeholder: "Owner's residential address", required: false },
  { id: 'images', label: 'Property Images', type: 'image', required: false }
];

export const buyRequirementSchema = [
  { id: 'requirementType', label: 'Requirement Type', type: 'select', options: ['Buy', 'Rent'], defaultValue: 'Buy', required: true },
  { id: 'requirementTitle', label: 'Requirement Title', type: 'text', placeholder: 'e.g. 3 BHK House Requirement', required: false },
  { id: 'propertyType', label: 'Property Type Required', type: 'select', options: ['Plot/Land', 'House/Villa', 'Residential Plot', 'Commercial Plot', 'Agricultural Land', 'Industrial Plot'], defaultValue: 'House/Villa', required: true },
  { id: 'locationSelector', label: 'Location & Region Selection', type: 'location_selector', locationFieldName: 'preferredLocation', required: true },
  { id: 'requiredArea', label: 'Required Area / Size', type: 'text', placeholder: 'e.g. 50 or 3', required: true, hasUnit: true, unitId: 'requiredAreaUnit', unitOptions: ['Cent', 'Sq. Ft.', 'Acre', 'BHK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK', 'Sq. Meter', 'Sq. Yard'], defaultUnit: 'Cent' },
  { id: 'budget', label: 'Max Purchase Budget (₹)', type: 'number', placeholder: 'e.g. 75', required: true, showIf: (data) => data.requirementType === 'Buy', hasUnit: true, unitId: 'budgetUnit', unitOptions: ['/ Cent', '/ Sq. Ft.', '/ Acre', '/ Month', '/ BHK', '/ House', '/ Sq. Meter', '/ Sq. Yard', 'All Properties'], defaultUnit: '/ Cent', isPricePerArea: true },
  { id: 'maximumMonthlyRent', label: 'Max Rent (₹)', type: 'number', placeholder: 'e.g. 20000', required: true, showIf: (data) => data.requirementType === 'Rent', hasUnit: true, unitId: 'maximumMonthlyRentUnit', unitOptions: ['/ Month', 'All Properties', '/ Sq. Ft.', '/ Cent', '/ Acre', '/ BHK', '/ House', '/ Sq. Meter', '/ Sq. Yard'], defaultUnit: '/ Month', isPricePerArea: true },
  { id: 'description', label: 'Description / Remarks', type: 'textarea', placeholder: 'Specific details (e.g. corner plot, clear titles required)', required: false },
  { id: 'buyerName', label: 'Buyer Name', type: 'text', placeholder: 'e.g. Suresh Nair', required: true },
  { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: 'e.g. 9123456789', required: true },
  { id: 'buyerAddress', label: 'Buyer Address', type: 'textarea', placeholder: "Buyer's residential/office address", required: false }
];
