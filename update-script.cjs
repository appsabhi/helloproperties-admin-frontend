const fs = require('fs');
const path = 'e:\\Fragmentree_\\Website\\Helloproperties\\Customer-frontend\\src\\components\\PropertiesPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

const target1 = `<img
                          src={prop.imageUrl}
                          alt={prop.title}
                          className="ref-card-img"
                          loading="lazy"
                        />`;

const replacement1 = `{prop.imageUrl ? (
                          <img
                            src={prop.imageUrl}
                            alt={prop.title}
                            className="ref-card-img"
                            loading="lazy"
                          />
                        ) : prop.videoUrl || prop.video ? (
                          <video
                            src={prop.videoUrl || prop.video}
                            className="ref-card-img"
                            preload="metadata"
                            muted
                            playsInline
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className="ref-card-img" style={{ backgroundColor: "#e2e8f0" }} />
                        )}`;

const target2 = `<img
                  src={selectedProperty.imageUrl}
                  alt={selectedProperty.title}
                  className="modal-hero-img"
                />`;

const replacement2 = `{selectedProperty.imageUrl ? (
                  <img
                    src={selectedProperty.imageUrl}
                    alt={selectedProperty.title}
                    className="modal-hero-img"
                  />
                ) : selectedProperty.videoUrl || selectedProperty.video ? (
                  <video
                    src={selectedProperty.videoUrl || selectedProperty.video}
                    className="modal-hero-img"
                    preload="metadata"
                    muted
                    playsInline
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                ) : (
                  <div className="modal-hero-img" style={{ backgroundColor: "#e2e8f0" }} />
                )}`;

content = content.replace(target1.replace(/\r\n/g, '\n'), replacement1);
content = content.replace(target1, replacement1);

content = content.replace(target2.replace(/\r\n/g, '\n'), replacement2);
content = content.replace(target2, replacement2);

fs.writeFileSync(path, content, 'utf-8');
console.log('Done replacing PropertiesPage.jsx');
