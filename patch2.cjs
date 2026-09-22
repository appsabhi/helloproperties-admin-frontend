const fs = require('fs');
const file = 'e:/Fragmentree_/Website/Helloproperties/Customer-frontend/src/components/PropertiesPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<div className="ref-card-badge">
                          <span>{prop.listingType === "Rent" ? "For Rent" : "For Sale"}</span>
                        </div>`;

const replacement = `<div className="ref-card-badge">
                          <span>{prop.listingType === "Rent" ? "For Rent" : "For Sale"}</span>
                          {prop.status && prop.status !== 'Available' && (
                            <span style={{ marginLeft: '6px', backgroundColor: prop.status === 'Sold' ? '#334155' : prop.status === 'Under Negotiation' ? '#d97706' : '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{prop.status}</span>
                          )}
                        </div>`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log('Patch applied to PropertiesPage.jsx');
