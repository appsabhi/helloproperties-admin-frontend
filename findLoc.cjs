const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Properties.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('preferredLocation') || line.includes('location')) {
    if (line.includes('map') || line.includes('split')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  }
});
