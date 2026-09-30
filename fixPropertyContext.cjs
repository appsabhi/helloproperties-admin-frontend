const fs = require('fs');
let c = fs.readFileSync('src/context/PropertyContext.jsx', 'utf8');

c = c.replace(
  '        return (item.matchScore || 0) >= 50;\n    });\n  }, []);',
  `        return (item.matchScore || 0) >= 50;
    }).map(item => {
      if (!item.matchReasons || item.matchReasons.length === 0) {
        const isTargetProperty = target.expectedPrice !== undefined || target.monthlyRent !== undefined || target.listingType !== undefined;
        const prop = isTargetProperty ? target : item;
        const req = isTargetProperty ? item : target;
        try {
          const localResult = computeMatchScore(prop, req);
          if (localResult && localResult.matchReasons) {
            return { ...item, matchReasons: localResult.matchReasons };
          }
        } catch(e) {}
      }
      return item;
    });
  }, [computeMatchScore]);`
);

// If the previous replace failed due to different line endings, try this:
c = c.replace(
  /return \(item\.matchScore \|\| 0\) >= 50;\s*}\);\s*}, \[\]\);/,
  `return (item.matchScore || 0) >= 50;
    }).map(item => {
      if (!item.matchReasons || item.matchReasons.length === 0) {
        const isTargetProperty = target.expectedPrice !== undefined || target.monthlyRent !== undefined || target.listingType !== undefined;
        const prop = isTargetProperty ? target : item;
        const req = isTargetProperty ? item : target;
        try {
          const localResult = computeMatchScore(prop, req);
          if (localResult && localResult.matchReasons) {
            return { ...item, matchReasons: localResult.matchReasons };
          }
        } catch(e) {}
      }
      return item;
    });
  }, [computeMatchScore]);`
);

fs.writeFileSync('src/context/PropertyContext.jsx', c);
console.log("Replaced");
