const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard-view.tsx', 'utf8');

// Conditionally hide renderBanners()
code = code.replace(/\{activeTab === 'banners' && renderBanners\(\)\}/g, "{activeTab === 'banners' && !isCreatingBanner && renderBanners()}");

// Update Banner form Cancel button
code = code.replace(/<Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100 rounded-full" onClick=\{\(\) => setIsCreatingBanner\(false\)\}>\s*<X className="w-6 h-6" \/>\s*<\/Button>/g, 
  '<Button variant="outline" className="text-gray-600 rounded-xl" onClick={() => setIsCreatingBanner(false)}><ArrowLeft className="w-4 h-4 mr-2" /> Cancel</Button>');

// Remove <motion.div> around isCreatingBanner
code = code.replace(/\{isCreatingBanner && \(\s*<motion\.div[\s\S]*?>([\s\S]*?)<\/motion\.div>\s*\)\}/g, "{isCreatingBanner && ($1)}");

fs.writeFileSync('src/components/dashboard-view.tsx', code);
console.log('dashboard-view Banners Refactored successfully!');
