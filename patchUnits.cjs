const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'PropertyContext.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add localStorage patch logic in formatBackendRequirement
content = content.replace(
  /const formatBackendRequirement = \(r\) => \(\{/g,
  `const formatBackendRequirement = (r) => {
    const patchedUnits = (() => { try { return JSON.parse(localStorage.getItem('hp_patched_units') || '{}'); } catch(e) { return {}; }})();
    const reqId = r._id || r.id || r.requirementId;
    const patch = patchedUnits[reqId] || {};
    return {`
);

content = content.replace(
  /budgetUnit: r\.budgetUnit \|\| r\.budget_unit \|\| r\.priceUnit \|\| r\.price_unit,/g,
  `budgetUnit: r.budgetUnit || r.budget_unit || r.priceUnit || r.price_unit || patch.budgetUnit,`
);

content = content.replace(
  /createdAt: r\.createdAt \|\| r\.created_at \|\| new Date\(\)\.toISOString\(\)\n\s*\}\);/g,
  `createdAt: r.createdAt || r.created_at || new Date().toISOString()
    };
  };`
);

// Add saving patch logic in updateRequirement
content = content.replace(
  /const formatted = formatBackendRequirement\(resData\.data\);/g,
  `const formatted = formatBackendRequirement(resData.data);
          try {
            const patchedUnits = JSON.parse(localStorage.getItem('hp_patched_units') || '{}');
            patchedUnits[formatted.id] = { budgetUnit: updatedData.budgetUnit };
            localStorage.setItem('hp_patched_units', JSON.stringify(patchedUnits));
            formatted.budgetUnit = updatedData.budgetUnit || formatted.budgetUnit;
          } catch(e) {}`
);

// Add saving patch logic in addRequirement
content = content.replace(
  /const formatted = formatBackendRequirement\(resData\.data\);\n\s*formatted\.matches = resData\.matches \|\| \[\];/g,
  `const formatted = formatBackendRequirement(resData.data);
          try {
            const patchedUnits = JSON.parse(localStorage.getItem('hp_patched_units') || '{}');
            patchedUnits[formatted.id] = { budgetUnit: reqData.budgetUnit };
            localStorage.setItem('hp_patched_units', JSON.stringify(patchedUnits));
            formatted.budgetUnit = reqData.budgetUnit || formatted.budgetUnit;
          } catch(e) {}
          formatted.matches = resData.matches || [];`
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Added frontend unit patch');
