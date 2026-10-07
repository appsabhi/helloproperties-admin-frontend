const fs = require('fs');

const filePath = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/context/PropertyContext.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /const sanitizedName = fileName\.replace\(\/\[\^a-zA-Z0-9_\.-\]\/g, '_'\);\s*const targetPath = `properties\/videos\/property-\$\{Date\.now\(\)\}-\$\{sanitizedName\}`;\s*const handleUploadEndpoint = `\$\{API_BASE_URL\}\/upload\/handle-upload`;\s*const blob = await upload\(targetPath, file, \{\s*access: 'public',\s*handleUploadUrl: handleUploadEndpoint,\s*headers: token \? \{ 'Authorization': `Bearer \$\{token\}` \} : \{\},\s*clientPayload: JSON\.stringify\(\{\s*originalName: fileName,\s*size: file\.size,\s*mimeType: file\.type\s*\}\)\s*\}\);/g;

const replacement = `const handleUploadEndpoint = \`\${API_BASE_URL}/upload/handle-upload\`;

      const presignResponse = await fetch(handleUploadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': \`Bearer \${token}\` } : {})
        },
        body: JSON.stringify({
          filename: fileName,
          contentType: file.type || 'video/mp4'
        })
      });

      if (!presignResponse.ok) {
        throw new Error('Failed to get secure upload URL from server.');
      }

      const { presignedUrl, publicUrl } = await presignResponse.json();

      if (!presignedUrl || !publicUrl) {
        throw new Error('Invalid upload credentials received from server.');
      }

      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'video/mp4'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video to storage.');
      }

      const blob = { url: publicUrl };`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    console.log("Success");
} else {
    console.log("Not found");
}
