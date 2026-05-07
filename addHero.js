const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend/src/pages');
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('Page.jsx') || file === 'Dashboard.jsx') {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Make sure we only replace once in case we run it multiple times
    if (!content.includes('Premium WFTO Hero Banner Bleed')) {
      const regex = /<div className="w-full(?: max-w-[a-z0-9-]+)? mx-auto space-y-6">[\s]+<h1 className="text-2xl font-bold text-gray-900">([^<]+)<\/h1>[\s]+<p className="text-gray-500 text-sm -mt-4">([^<]+)<\/p>/;
      // also covering <div className="w-full space-y-6"> which ProcessorPage uses directly
      const regex2 = /<div className="w-full space-y-6">[\s]+<h1 className="text-2xl font-bold text-gray-900">([^<]+)<\/h1>[\s]+<p className="text-gray-500 text-sm -mt-4">([^<]+)<\/p>/;
      
      let matched = false;
      
      content = content.replace(regex2, (match, p1, p2) => {
        matched = true;
        return `<div className="w-full space-y-6 pb-12">
      {/* Premium WFTO Hero Banner Bleed */}
      <div className="-mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 mb-8 relative h-64 md:h-80 flex items-center justify-center overflow-hidden bg-slate-900 shadow-inner">
        <div className="absolute inset-0 z-0">
          <img src="/hero_fairtrade.png" alt="Fair Trade Hero" className="w-full h-full object-cover opacity-50 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-4 mt-12 w-full max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md text-center">
            ${p1}
          </h1>
          <p className="text-blue-200 text-lg md:text-xl font-medium max-w-2xl text-center drop-shadow">
            ${p2}
          </p>
        </div>
      </div>`;
      });
      
      if (!matched) {
        // try regex1 if regex2 failed
        content = content.replace(regex, (match, p1, p2) => {
          return `<div className="w-full space-y-6 pb-12">
      {/* Premium WFTO Hero Banner Bleed */}
      <div className="-mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 mb-8 relative h-64 md:h-80 flex items-center justify-center overflow-hidden bg-slate-900 shadow-inner">
        <div className="absolute inset-0 z-0 bg-[#2D3748]">
          <img src="/hero_fairtrade.png" alt="Fair Trade Hero" className="w-full h-full object-cover opacity-50 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2D3748] via-[#2D3748]/60 to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-4 mt-12 w-full max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md text-center">
            ${p1}
          </h1>
          <p className="text-blue-100 text-lg md:text-xl font-medium max-w-2xl text-center drop-shadow">
            ${p2}
          </p>
        </div>
      </div>`;
        });
      }

      fs.writeFileSync(fullPath, content);
      console.log('Updated ' + file);
    }
  }
}
