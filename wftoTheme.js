const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Indigo -> Blue for the primary action color (matching WFTO's bright blue)
      content = content.replace(/bg-indigo-/g, 'bg-blue-');
      content = content.replace(/text-indigo-/g, 'text-blue-');
      content = content.replace(/border-indigo-/g, 'border-blue-');
      content = content.replace(/ring-indigo-/g, 'ring-blue-');
      content = content.replace(/from-indigo-/g, 'from-blue-');
      content = content.replace(/to-indigo-/g, 'to-blue-');
      content = content.replace(/fill-indigo-/g, 'fill-blue-');

      fs.writeFileSync(fullPath, content);
    }
  }
}

// Ensure the image exists or move it to public if needed
// We will manually add the hero section classes to the Dashboards.

processDir(path.join(__dirname, 'frontend/src'));
console.log('Blue WFTO Theme Applied!');
