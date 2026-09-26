const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// Find the start of the match mapping
const searchStr = `{(matchFilter === 'top' ? matchResults.filter(m => m.matchScore >= 90) : matchResults).map((matchItem, idx) => (`;
const replaceStr = `{(matchFilter === 'top' ? matchResults.filter(m => m.matchScore >= 90) : matchResults).map((matchItem, idx) => {
                  console.log("MATCH ITEM:", matchItem);
                  return (`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  // Also we need to close the curly brace at the end of the map function
  // The end of the map function looks like:
  //                 ))}
  //               </div>
  const endSearch = `                  ))}
                </div>`;
  const endReplace = `                  )})}
                </div>`;
  content = content.replace(endSearch, endReplace);
  
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Failed to find search string");
}
