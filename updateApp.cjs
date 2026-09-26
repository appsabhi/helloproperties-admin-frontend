const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<Route\s+path="\/settings"/,
  `<Route
                  path="/properties/:id"
                  element={
                    <ProtectedRoute>
                      <Properties />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/requirements/:id"
                  element={
                    <ProtectedRoute>
                      <Properties />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated App.jsx");
