const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

const search = `                  )})}
                </div>`;

const replace = `                  ))}
                </div>`;

content = content.replace(search, replace);
fs.writeFileSync(path, content, 'utf8');
console.log("Success");
