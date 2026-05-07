const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Indigo theme
      content = content.replace(/bg-green-/g, 'bg-indigo-');
      content = content.replace(/text-green-/g, 'text-indigo-');
      content = content.replace(/border-green-/g, 'border-indigo-');
      content = content.replace(/ring-green-/g, 'ring-indigo-');
      content = content.replace(/from-green-/g, 'from-indigo-');
      content = content.replace(/to-green-/g, 'to-indigo-');

      content = content.replace(/bg-emerald-/g, 'bg-blue-');
      content = content.replace(/text-emerald-/g, 'text-blue-');
      content = content.replace(/to-emerald-/g, 'to-blue-');
      
      // Make Layout wider
      content = content.replace(/max-w-7xl mx-auto/g, 'w-full');
      content = content.replace(/max-w-6xl mx-auto/g, 'w-full');
      content = content.replace(/max-w-5xl mx-auto/g, 'w-full');
      content = content.replace(/max-w-4xl mx-auto/g, 'w-full');
      content = content.replace(/max-w-3xl mx-auto/g, 'w-full max-w-5xl mx-auto'); // just slightly wider
      
      // Update tracking icons that were specifically green
      content = content.replace(/fill-green-500/g, 'fill-indigo-500');

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'frontend/src'));
console.log('Theme successfully rewritten to Indigo and made wider!');
