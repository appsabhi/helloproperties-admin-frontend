const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/pages/Properties.jsx';
let content = fs.readFileSync(path, 'utf8');

// Update imports
content = content.replace(
  /import \{ useLocation, useNavigate \} from 'react-router-dom';/,
  `import { useLocation, useNavigate, useParams } from 'react-router-dom';`
);

// Add useParams logic inside Properties component
content = content.replace(
  /const location = useLocation\(\);/,
  `const location = useLocation();
  const { id } = useParams();`
);

// Add useEffect to set viewingDetailTarget based on URL id
const effectLogic = `
  useEffect(() => {
    if (id) {
      if (location.pathname.startsWith('/requirements/')) {
        const req = requirements.find(r => String(r.id) === id || r.requirementId === id);
        if (req) {
          setViewingDetailTarget({ type: 'requirement', item: req });
        }
      } else if (location.pathname.startsWith('/properties/')) {
        const prop = properties.find(p => String(p.id) === id || p.propertyId === id);
        if (prop) {
          setViewingDetailTarget({ type: 'property', item: prop });
        }
      }
    }
  }, [id, properties, requirements, location.pathname]);
`;

content = content.replace(
  /(const \[viewingDetailTarget, setViewingDetailTarget\] = useState\(null\);)/,
  `$1\n${effectLogic}`
);

// Update back button logic inside the detailed view to use navigate
content = content.replace(
  /onClick=\{\(\) => setViewingDetailTarget\(null\)\}\s*className="inline-flex items-center gap-1\.5 px-3 py-1\.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-bold transition-colors shadow-sm"/g,
  `onClick={() => navigate(viewingDetailTarget.type === 'requirement' ? '/properties/requirements' : '/properties/listings')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-bold transition-colors shadow-sm"`
);

// Update the match result card View Details button to navigate instead of opening modal
content = content.replace(
  /onClick=\{\(\) => \{\s*setViewingDetailTarget\(\{ \s*type: activeMatchTarget\.type === 'property' \? 'requirement' : 'property', \s*item: matchItem \s*\}\);\s*\}\}/g,
  `onClick={() => {
                          navigate(\`/\${activeMatchTarget.type === 'property' ? 'requirements' : 'properties'}/\${matchItem.id}\`);
                        }}`
);

// In the main list, click "View Details" to navigate to detail page URL
content = content.replace(
  /onClick=\{\(\) => setViewingDetailTarget\(\{ type: 'property', item: prop \}\)\}/g,
  `onClick={() => navigate(\`/properties/\${prop.id}\`)}`
);

content = content.replace(
  /onClick=\{\(\) => setViewingDetailTarget\(\{ type: 'requirement', item: req \}\)\}/g,
  `onClick={() => navigate(\`/requirements/\${req.id}\`)}`
);


fs.writeFileSync(path, content, 'utf8');
console.log("Updated routing logic in Properties.jsx");
