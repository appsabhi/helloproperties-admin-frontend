const fs = require('fs');
const path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/schemas/formSchemas.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /export const buyRequirementSchema = \[/,
  `export const buyRequirementSchema = [
    { id: 'interestedPropertyId', label: 'Interested Property (Optional)', type: 'select', options: [], required: false },`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated formSchemas.js");
