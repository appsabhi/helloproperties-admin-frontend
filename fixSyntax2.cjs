const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'PropertyContext.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const target = "    createdAt: r.createdAt || r.created_at || new Date().toISOString()\r\n  });";
const replacement = "    createdAt: r.createdAt || r.created_at || new Date().toISOString()\r\n  };\r\n};";

if (content.includes(target)) {
  content = content.replace(target, replacement);
} else {
  const target2 = "    createdAt: r.createdAt || r.created_at || new Date().toISOString()\n  });";
  const replacement2 = "    createdAt: r.createdAt || r.created_at || new Date().toISOString()\n  };\n};";
  content = content.replace(target2, replacement2);
}

fs.writeFileSync(filePath, content, 'utf8');
