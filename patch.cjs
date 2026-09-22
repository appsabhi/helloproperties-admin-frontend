const fs = require('fs');
const file = 'e:/Fragmentree_/Website/Helloproperties/Customer-frontend/src/components/FeaturedProperties.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'listingType: p.listingType === "Rent" ? "For Rent" : "For Sale",\n      img: p.imageUrl',
  'listingType: p.listingType === "Rent" ? "For Rent" : "For Sale",\n      status: p.status,\n      img: p.imageUrl'
);

content = content.replace(
  '<span className="arch-pill-badge-status">{prop.listingType}</span>\n                </div>',
  `<span className="arch-pill-badge-status">{prop.listingType}</span>\n                  {prop.status && prop.status !== 'Available' && (\n                    <span className="arch-pill-badge-status" style={{ backgroundColor: prop.status === 'Sold' ? '#334155' : prop.status === 'Under Negotiation' ? '#d97706' : '#dc2626' }}>\n                      {prop.status}\n                    </span>\n                  )}\n                </div>`
);

fs.writeFileSync(file, content);
console.log('Patch applied to FeaturedProperties.jsx');
