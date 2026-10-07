import sys
import re

file_path = 'e:/Fragmentree_/Website/Helloproperties/Admin-frontend/src/context/PropertyContext.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(
    r"const sanitizedName = fileName\.replace\(/\[\^a-zA-Z0-9_\.-\]/g, '_'\);\s*"
    r"const targetPath = `properties/videos/property-\$\{Date\.now\(\)\}-\$\{sanitizedName\}`;\s*"
    r"const handleUploadEndpoint = `\$\{API_BASE_URL\}/upload/handle-upload`;\s*"
    r"const blob = await upload\(targetPath, file, \{\s*"
    r"access: 'public',\s*"
    r"handleUploadUrl: handleUploadEndpoint,\s*"
    r"headers: token \? \{ 'Authorization': `Bearer \$\{token\}` \} : \{\},\s*"
    r"clientPayload: JSON\.stringify\(\{\s*"
    r"originalName: fileName,\s*"
    r"size: file\.size,\s*"
    r"mimeType: file\.type\s*"
    r"\}\)\s*"
    r"\}\);"
)

replacement = """const handleUploadEndpoint = `${API_BASE_URL}/upload/handle-upload`;

      const presignResponse = await fetch(handleUploadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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

      const blob = { url: publicUrl };"""

if pattern.search(content):
    content = pattern.sub(replacement, content)
    with open(file_path, 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    print("Success")
else:
    print("Not found")
