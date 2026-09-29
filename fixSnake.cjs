const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'PropertyContext.jsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /budgetUnit: reqData\.budgetUnit,\s*priceUnit: reqData\.budgetUnit \|\| reqData\.maximumMonthlyRentUnit,/g,
  `budgetUnit: reqData.budgetUnit,
        budget_unit: reqData.budgetUnit,
        priceUnit: reqData.budgetUnit || reqData.maximumMonthlyRentUnit,
        price_unit: reqData.budgetUnit || reqData.maximumMonthlyRentUnit,`
);

content = content.replace(
  /budgetUnit: updatedData\.budgetUnit,\s*priceUnit: updatedData\.budgetUnit \|\| updatedData\.maximumMonthlyRentUnit,/g,
  `budgetUnit: updatedData.budgetUnit,
        budget_unit: updatedData.budgetUnit,
        priceUnit: updatedData.budgetUnit || updatedData.maximumMonthlyRentUnit,
        price_unit: updatedData.budgetUnit || updatedData.maximumMonthlyRentUnit,`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added snake_case variants to payloads');
