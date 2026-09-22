const fs = require('fs');
const path = 'e:\\Fragmentree_\\Website\\Helloproperties\\Customer-frontend\\src\\components\\FeaturedProperties.jsx';
let content = fs.readFileSync(path, 'utf-8');

const target1 = `img: p.imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85",`;

const replacement1 = `img: p.imageUrl,
      video: p.videoUrl || p.video,`;

const target2 = `<img src={prop.img} alt={prop.title} className="arch-card-media-img" loading="lazy" />`;

const replacement2 = `{prop.img ? (
                  <img src={prop.img} alt={prop.title} className="arch-card-media-img" loading="lazy" />
                ) : prop.video ? (
                  <video src={prop.video} className="arch-card-media-img" preload="metadata" muted playsInline style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                ) : (
                  <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85" alt={prop.title} className="arch-card-media-img" loading="lazy" />
                )}`;

content = content.replace(target1.replace(/\r\n/g, '\n'), replacement1);
content = content.replace(target1, replacement1);

content = content.replace(target2.replace(/\r\n/g, '\n'), replacement2);
content = content.replace(target2, replacement2);

fs.writeFileSync(path, content, 'utf-8');
console.log('Done replacing FeaturedProperties.jsx');
