const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard-view.tsx', 'utf8');

if (!code.includes('LineChart')) {
  code = code.replace(/import \{/, 'import { LineChart,');
}

// Add to TAB_ITEMS
code = code.replace(/\{ key: 'home', label: 'Home', icon: LayoutDashboard \},/, 
  "{ key: 'home', label: 'Home', icon: LayoutDashboard },\n  { key: 'analytics', label: 'Analytics', icon: LineChart },");

// Define renderAnalytics
const analyticsLogic = `
  const renderAnalytics = () => {
    // Calculate total metrics across all listings
    const totalViews = listings.reduce((acc, curr) => acc + (curr.views || 0), 0)
    const totalWhatsappClicks = listings.reduce((acc, curr) => acc + (curr.whatsappClicks || 0), 0)
    const totalCallClicks = listings.reduce((acc, curr) => acc + (curr.callClicks || 0), 0)
    const totalShareClicks = listings.reduce((acc, curr) => acc + (curr.shareClicks || 0), 0)

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <h3 className="text-2xl font-black text-gray-900">Vendor Analytics</h3>
        <p className="text-sm text-gray-500 mb-6">Track your business performance across all listings.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <LayoutDashboard className="w-8 h-8 text-blue-500 mb-2" />
            <h3 className="text-3xl font-black text-gray-900">{totalViews}</h3>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Profile Views</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-8 h-8 text-green-500 mb-2" />
            <h3 className="text-3xl font-black text-gray-900">{totalWhatsappClicks}</h3>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mt-1">WhatsApp Leads</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex flex-col items-center justify-center text-center">
            <Phone className="w-8 h-8 text-indigo-500 mb-2" />
            <h3 className="text-3xl font-black text-gray-900">{totalCallClicks}</h3>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-1">Call Leads</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center justify-center text-center">
            <Share2 className="w-8 h-8 text-orange-500 mb-2" />
            <h3 className="text-3xl font-black text-gray-900">{totalShareClicks}</h3>
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mt-1">Shares</p>
          </div>
        </div>
      </div>
    )
  }
`;

// Phone and Share2 might not be imported from lucide-react. Let's add them.
if (!code.includes('Phone,')) {
  code = code.replace(/import \{/, 'import { Phone, Share2,');
}

// Insert logic before return (
code = code.replace(/return \(\s*<div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">/, analyticsLogic + "\n  return (\n    <div className=\"min-h-screen bg-gray-50 flex flex-col md:flex-row\">");

// Render analytics tab
code = code.replace(/\{activeTab === 'home' && renderHome\(\)\}/, "{activeTab === 'home' && renderHome()}\n          {activeTab === 'analytics' && renderAnalytics()}");

// Also add to activeTab type if it exists:
code = code.replace(/useState<'home' \| 'listings' \| 'real_estate' \| 'banners' \| 'stories' \| 'my_posts' \| 'wallet' \| 'settings'>\('home'\)/, 
  "useState<'home' | 'analytics' | 'listings' | 'real_estate' | 'banners' | 'stories' | 'my_posts' | 'wallet' | 'settings'>('home')");

fs.writeFileSync('src/components/dashboard-view.tsx', code);
console.log('Analytics Tab Added successfully to Dashboard!');
