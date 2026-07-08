const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard-view.tsx', 'utf-8');

// 1. Sidebar HTML (to be inserted before the main content div)
const sidebarHtml = `
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:bg-white md:border-r md:border-gray-200 md:shadow-sm md:z-40">
        <div className="p-6 flex flex-col gap-8 h-full">
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#4169E1] to-[#D4AF37]">Choutuppal</h2>
            <p className="text-xs text-gray-500 font-medium tracking-wider uppercase mt-1">Super App</p>
          </div>
          
          <div className="flex flex-col gap-2 flex-1">
            {TAB_ITEMS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={\`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm \${isActive ? 'bg-gradient-to-r from-[#4169E1]/10 to-[#D4AF37]/10 text-[#4169E1]' : 'text-gray-600 hover:bg-gray-50'}\`}
                >
                  <Icon className={\`w-5 h-5 \${isActive ? 'text-[#4169E1]' : 'text-gray-400'}\`} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {user && (
            <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#4169E1] to-[#D4AF37] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-gray-900 line-clamp-1">{user.name}</span>
                <span className="text-xs text-gray-500">{user.phone}</span>
              </div>
            </div>
          )}
        </div>
      </div>
`;

// Wrap the main content with md:ml-64
content = content.replace(
  '<div className="min-h-screen [&]:bg-gray-50 [&]:text-gray-900">',
  '<div className="min-h-screen [&]:bg-gray-50 [&]:text-gray-900 md:flex">' + sidebarHtml + '\\n      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">'
);

// Close the wrapper at the end
content = content.replace(
  /}\s*\n\s*<\/div>\s*\n\s*\)\s*\n}\s*$/,
  '}\n      </div>\n    </div>\n  )\n}\n'
);

// 2. Hide Bottom Nav on Desktop
content = content.replace(
  '<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe-bottom z-40">',
  '<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe-bottom z-40 md:hidden">'
);

// 3. Make main content area wider on desktop
content = content.replace(
  '<div className="p-4 md:p-6 md:pb-24 max-w-lg mx-auto w-full">',
  '<div className="p-4 md:p-8 md:pb-12 max-w-lg md:max-w-5xl mx-auto w-full">'
);

// 4. Quick stats boxes in a single row on desktop (grid-cols-1 md:grid-cols-3)
// Actually the current is "grid grid-cols-3 gap-3". So on mobile they are squished. We can change to grid-cols-1 or 3.
content = content.replace(
  '<div className="grid grid-cols-3 gap-3">',
  '<div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6">'
);

// 5. Update Add Listing Modal to be centered on desktop
content = content.replace(
  'className="fixed inset-0 z-[100] bg-white flex flex-col"',
  'className="fixed inset-0 z-[100] bg-white md:bg-black/50 flex flex-col md:items-center md:justify-center md:p-6"'
);

// Wrap modal content to have a max-w and rounded borders on desktop
content = content.replace(
  '{/* Header */}',
  '<div className="flex flex-col w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl md:bg-white md:rounded-2xl md:shadow-2xl md:overflow-hidden relative">\\n            {/* Header */}'
);

// Find the end of the modal to close this div. The modal content is right before `</motion.div>`
content = content.replace(
  /<\/div>\s*<\/motion.div>/,
  '</div>\n            </div>\n          </motion.div>'
);

// Hide Top Header on Desktop since we have sidebar
content = content.replace(
  '<div className="bg-white px-6 py-4 sticky top-0 z-30 shadow-sm border-b border-gray-100 flex items-center justify-between">',
  '<div className="bg-white px-6 py-4 sticky top-0 z-30 shadow-sm border-b border-gray-100 flex items-center justify-between md:hidden">'
);

// Fix FAB to not be covered by Bottom Nav on mobile, and position correctly on desktop
content = content.replace(
  'className="fixed bottom-24 right-6 bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-transform active:scale-95 z-30 flex items-center gap-2 font-bold"',
  'className="fixed bottom-24 md:bottom-12 right-6 md:right-12 bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white p-4 md:px-6 rounded-full shadow-xl hover:shadow-2xl transition-transform active:scale-95 z-30 flex items-center gap-2 font-bold"'
);

fs.writeFileSync('src/components/dashboard-view.tsx', content, 'utf-8');
console.log('Patched dashboard-view.tsx');
