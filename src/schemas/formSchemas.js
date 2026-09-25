export const sellPropertySchema = [
  { id: 'enquirySource', label: 'Enquiry Source', type: 'select', options: ['Instagram Video', 'Phone Call', 'WhatsApp', 'Direct Visitor', 'Reference', 'Other'], defaultValue: 'Phone Call', required: false },
  { id: 'otherEnquirySource', label: 'Please specify other source', type: 'text', placeholder: 'e.g. Facebook', required: true, showIf: (data) => data.enquirySource === 'Other' },
  { id: 'listingType', label: 'Listing Type', type: 'select', options: ['Sale', 'Rent'], defaultValue: 'Sale', required: true },
  { id: 'title', label: 'Property Title', type: 'text', placeholder: 'e.g. BHK Modern Villa in Town', required: true },
  { id: 'propertyType', label: 'Property Type', type: 'select', options: ['Plot/Land', 'House/Villa', 'Apartment/Flat', 'Commercial Building', 'Residential Plot', 'Commercial Plot', 'Agricultural Land', 'Industrial Plot'], defaultValue: 'House/Villa', required: true },
  { id: 'locationSelector', label: 'Location & Region Selection', type: 'location_selector', locationFieldName: 'location', required: true },
  { id: 'area', label: 'Area / Size', type: 'text', placeholder: 'e.g. 45 or 3', required: true, hasUnit: true, unitId: 'areaUnit', unitOptions: ['Cent', 'Sq. Ft.', 'Acre', 'BHK', 'Sq. Meter', 'Sq. Yard'], defaultUnit: 'Cent' },
  { id: 'expectedPrice', label: 'Expected Price (₹)', type: 'number', placeholder: 'e.g. 5000000 (for 50 Lakhs)', required: true, showIf: (data) => data.listingType === 'Sale', hasUnit: true, unitId: 'expectedPriceUnit', unitOptions: ['All Properties', '/ Cent', '/ Sq. Ft.', '/ Acre', '/ Month', '/ BHK', '/ House', '/ Sq. Meter', '/ Sq. Yard'], defaultUnit: 'All Properties', isPricePerArea: true },
  { id: 'monthlyRent', label: 'Rent (₹)', type: 'number', placeholder: 'e.g. 18000', required: true, showIf: (data) => data.listingType === 'Rent', hasUnit: true, unitId: 'monthlyRentUnit', unitOptions: ['/ Month', 'All Properties', '/ Sq. Ft.', '/ Cent', '/ Acre', '/ BHK', '/ House', '/ Sq. Meter', '/ Sq. Yard'], defaultUnit: '/ Month', isPricePerArea: true },
  { id: 'securityDeposit', label: 'Security Deposit (₹)', type: 'number', placeholder: 'e.g. 100000', required: false, showIf: () => false, hasUnit: true, unitId: 'securityDepositUnit', unitOptions: ['All Properties', 'Months'], defaultUnit: 'All Properties' },
  { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Add key features, road access details, soil type, etc.', required: false },
  { id: 'ownerName', label: 'Owner Name', type: 'text', placeholder: 'e.g. Ramesh Krishnan', required: true },
  { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: 'e.g. 9876543210', required: true },
  { id: 'ownerAddress', label: 'Owner Address', type: 'textarea', placeholder: "Owner's residential address", required: false },
  { id: 'images', label: 'Property Images', type: 'image', required: false },
  { id: 'video', label: 'Property Video (Upload File or Link)', type: 'video', required: false }
];

export const buyRequirementSchema = [
  { id: 'buyerStatus', label: 'Buyer Status / Rating', type: 'rating_bar', options: ['Hot (Willing to buy)', 'Mild (Just enquired)', 'Cold (Small interest)'], defaultValue: 'Hot (Willing to buy)', required: true },
  { id: 'enquirySource', label: 'Enquiry Source', type: 'select', options: ['Instagram Video', 'Phone Call', 'WhatsApp', 'Direct Visitor', 'Reference', 'Other'], defaultValue: 'Phone Call', required: false },
  { id: 'otherEnquirySource', label: 'Please specify other source', type: 'text', placeholder: 'e.g. Facebook', required: true, showIf: (data) => data.enquirySource === 'Other' },
  { id: 'requirementType', label: 'Requirement Type', type: 'select', options: ['Buy', 'Rent'], defaultValue: 'Buy', required: true },
  { id: 'requirementTitle', label: 'Requirement Title', type: 'text', placeholder: 'e.g. BHK House Requirement', required: false },
  { id: 'buyerName', label: 'Buyer Name', type: 'text', placeholder: 'e.g. Suresh Nair', required: true },
  { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: 'e.g. 9123456789', required: true },
  { id: 'buyerAddress', label: 'Buyer Address', type: 'textarea', placeholder: "Buyer's residential/office address", required: false },
  { id: 'propertyType', label: 'Property Type Required', type: 'select', options: ['Plot/Land', 'House/Villa', 'Apartment/Flat', 'Commercial Building', 'Residential Plot', 'Commercial Plot', 'Agricultural Land', 'Industrial Plot'], defaultValue: 'House/Villa', required: true },
  { id: 'locationSelector', label: 'Location & Region Selection', type: 'location_selector', locationFieldName: 'preferredLocation', required: true, allowMultiple: true },
  { id: 'requiredArea', label: 'Required Area / Size', type: 'text', placeholder: 'e.g. 50 or 3', required: true, hasUnit: true, unitId: 'requiredAreaUnit', unitOptions: ['Cent', 'Sq. Ft.', 'Acre', 'BHK', 'Sq. Meter', 'Sq. Yard'], defaultUnit: 'Cent' },
  { id: 'budget', label: 'Max Purchase Budget (₹)', type: 'number', placeholder: 'e.g. 7500000 (for 75 Lakhs)', required: true, showIf: (data) => data.requirementType === 'Buy', hasUnit: true, unitId: 'budgetUnit', unitOptions: ['All Properties', '/ Cent', '/ Sq. Ft.', '/ Acre', '/ Month', '/ BHK', '/ House', '/ Sq. Meter', '/ Sq. Yard'], defaultUnit: 'All Properties', isPricePerArea: true },
  { id: 'maximumMonthlyRent', label: 'Max Rent (₹)', type: 'number', placeholder: 'e.g. 20000', required: true, showIf: (data) => data.requirementType === 'Rent', hasUnit: true, unitId: 'maximumMonthlyRentUnit', unitOptions: ['/ Month', 'All Properties', '/ Sq. Ft.', '/ Cent', '/ Acre', '/ BHK', '/ House', '/ Sq. Meter', '/ Sq. Yard'], defaultUnit: '/ Month', isPricePerArea: true },
  { id: 'description', label: 'Description / Remarks', type: 'textarea', placeholder: 'Specific details (e.g. corner plot, clear titles required)', required: false }
];
