const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/components/SchemaForm.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /{field\.options && field\.options\.map\(opt => \(\s*<option key={opt} value={opt}>{opt}<\/option>\s*\)\)}/,
  `{field.options && field.options.map(opt => (
                          <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>
                            {typeof opt === 'object' ? opt.label : opt}
                          </option>
                        ))}`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated SchemaForm.jsx");
