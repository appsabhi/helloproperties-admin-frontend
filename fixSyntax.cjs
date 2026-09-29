const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'PropertyContext.jsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /status: r\.status \|\| 'Active',\n\s*createdAt: r\.createdAt \|\| r\.created_at \|\| new Date\(\)\.toISOString\(\)\n\s*\};\n\s*\};/g,
  "NO"
); // check if already replaced

content = content.replace(
  /status: r\.status \|\| 'Active',\n\s*createdAt: r\.createdAt \|\| r\.created_at \|\| new Date\(\)\.toISOString\(\)\n\s*\}\);/g,
  `status: r.status || 'Active',
    createdAt: r.createdAt || r.created_at || new Date().toISOString()
  };
};`
);

fs.writeFileSync(filePath, content, 'utf8');
