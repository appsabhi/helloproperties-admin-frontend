const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'PropertyContext.jsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /budgetUnit: reqData\.budgetUnit,/g,
  `budgetUnit: reqData.budgetUnit,\n        priceUnit: reqData.budgetUnit || reqData.maximumMonthlyRentUnit,`
);

content = content.replace(
  /budgetUnit: updatedData\.budgetUnit,/g,
  `budgetUnit: updatedData.budgetUnit,\n        priceUnit: updatedData.budgetUnit || updatedData.maximumMonthlyRentUnit,`
);

content = content.replace(
  /expectedPriceUnit: propertyData\.expectedPriceUnit,/g,
  `expectedPriceUnit: propertyData.expectedPriceUnit,\n        priceUnit: propertyData.expectedPriceUnit || propertyData.monthlyRentUnit,`
);

content = content.replace(
  /expectedPriceUnit: updatedData\.expectedPriceUnit,/g,
  `expectedPriceUnit: updatedData.expectedPriceUnit,\n        priceUnit: updatedData.expectedPriceUnit || updatedData.monthlyRentUnit,`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added priceUnit to payloads');
