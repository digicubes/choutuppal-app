const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard-view.tsx', 'utf8');

// 1. Move forms to be variables returning JSX or just keep them where they are but change styling and hide list.
// Actually, hiding the list is simple:
code = code.replace(/\{activeTab === 'listings' && renderListings\(\)\}/g, "{activeTab === 'listings' && !isCreatingListing && renderListings()}");
code = code.replace(/\{activeTab === 'real_estate' && renderRealEstate\(\)\}/g, "{activeTab === 'real_estate' && !isCreatingRealEstate && renderRealEstate()}");

// 2. We remove AnimatePresence and motion.div wrappers from the 3 forms, and make them standard divs that render INLINE.
// Instead of complex AST parsing, let's just regex replace the "fixed inset-0..." classes.
code = code.replace(/className="fixed inset-0 z-\[100\] bg-white md:bg-black\/55 flex flex-col md:items-center md:justify-center md:p-6"/g, 
  'className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col relative mt-4"');

code = code.replace(/className="fixed inset-0 z-\[100\] bg-white md:bg-black\/50 flex flex-col md:items-center md:justify-center md:p-6"/g, 
  'className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col relative mt-4"');

// 3. Remove md:max-w-3xl, md:max-h-[92vh] from the inner container so it expands inline.
code = code.replace(/className="flex flex-col w-full h-full md:h-auto md:max-h-\[92vh\] md:max-w-3xl md:bg-white md:rounded-2xl md:shadow-2xl md:overflow-hidden relative"/g,
  'className="flex flex-col w-full h-full relative"');

code = code.replace(/className="flex flex-col w-full h-full md:h-auto md:max-h-\[92vh\] md:max-w-2xl md:bg-white md:rounded-2xl md:shadow-2xl md:overflow-hidden relative"/g,
  'className="flex flex-col w-full h-full relative"');

code = code.replace(/className="flex flex-col w-full h-full md:h-auto md:max-h-\[90vh\] md:max-w-md md:bg-white md:rounded-2xl md:shadow-2xl md:overflow-hidden relative"/g,
  'className="flex flex-col w-full h-full relative"');

// 4. In the modals, we have buttons to close them. We'll rename the X icon to 'Cancel' or just keep the X. The user said: "Include a clear 'Cancel / Back to List' button to return to the table/grid."
// We can replace the top sticky header X button with a "Cancel / Back" button.
code = code.replace(/<Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100 rounded-full" onClick=\{\(\) => \{ setIsCreatingListing\(false\);/g, 
  '<Button variant="outline" className="text-gray-600 rounded-full" onClick={() => { setIsCreatingListing(false);');

code = code.replace(/<Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100 rounded-full" onClick=\{\(\) => \{ setIsCreatingRealEstate\(false\);/g, 
  '<Button variant="outline" className="text-gray-600 rounded-full" onClick={() => { setIsCreatingRealEstate(false);');

// 5. Replace <X ...> inside these buttons with "Cancel" text if it's there. 
// This is a bit tricky with regex, so we'll just replace the whole header segment.
code = code.replace(/<Button variant="outline" className="text-gray-600 rounded-full" onClick=\{\(\) => \{ setIsCreatingListing\(false\);([\s\S]*?)<X className="w-6 h-6" \/>\s*<\/Button>/g, 
  '<Button variant="outline" className="text-gray-600 rounded-xl" onClick={() => { setIsCreatingListing(false);$1<ArrowLeft className="w-4 h-4 mr-2" /> Cancel</Button>');

code = code.replace(/<Button variant="outline" className="text-gray-600 rounded-full" onClick=\{\(\) => \{ setIsCreatingRealEstate\(false\);([\s\S]*?)<X className="w-6 h-6" \/>\s*<\/Button>/g, 
  '<Button variant="outline" className="text-gray-600 rounded-xl" onClick={() => { setIsCreatingRealEstate(false);$1<ArrowLeft className="w-4 h-4 mr-2" /> Cancel</Button>');

// Remove AnimatePresence wrappers to prevent modal-like entrance from breaking inline flow
code = code.replace(/<AnimatePresence>/g, '<>');
code = code.replace(/<\/AnimatePresence>/g, '</>');

// Since we change the class to mt-4, they will render below the main div. Let's actually move them inside the main div where the tabs are!
// Currently:
// <div className="p-4 md:p-8 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
//    {activeTab === 'home' && renderHome()}
//    ...
// </div>
// <AnimatePresence> {isCreatingListing && ...

// Let's move the isCreating... blocks inside the div!
let modalBlockRegex = /<\/div>\s*<>\s*\{isCreatingListing && \([\s\S]*?<\/div>\s*<\/motion\.div>\s*\)\}\s*<\/>\s*<>\s*\{isCreatingRealEstate && \([\s\S]*?<\/div>\s*<\/motion\.div>\s*\)\}\s*<\/>\s*<>\s*\{isCreatingBanner && \([\s\S]*?<\/div>\s*<\/motion\.div>\s*\)\}\s*<\/>/;

let m = modalBlockRegex.exec(code);
if (m) {
    let modals = m[0].substring(6); // remove </div>
    code = code.replace(modalBlockRegex, '');
    code = code.replace(/\{activeTab === 'settings' && renderSettings\(\)\}\s*<\/div>/, 
    "{activeTab === 'settings' && renderSettings()}\n" + modals + "\n</div>");
}

fs.writeFileSync('src/components/dashboard-view.tsx', code);
console.log('dashboard-view Refactored successfully!');
