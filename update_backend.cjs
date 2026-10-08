const fs = require('fs');
const path = '../backend/routes/uploadRoutes.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'const DEFAULT_MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB default',
  'const DEFAULT_MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB default'
);

content = content.replace(
  'limits: { fileSize: 50 * 1024 * 1024 } // General buffer upper bound',
  'limits: { fileSize: 105 * 1024 * 1024 } // General buffer upper bound (105MB to allow custom error handling)'
);

fs.writeFileSync(path, content);
console.log('Backend uploadRoutes.js updated successfully.');
