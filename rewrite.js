const fs = require('fs');
const content = fs.readFileSync('src/components/agent-dashboard.tsx.bak', 'utf8');

const roleInjection = \
  const role = user?.role?.toLowerCase() || '';
  if (role !== 'agent') {
    return <ForbiddenPage />
  }
\;

let newContent = content.replace("  if (!user) {", roleInjection + "\n  if (!user) {");
newContent = newContent.replace(
  "const [activeTab, setActiveTab] = useState<'add_listing' | 'bulk_upload' | 'my_assignments'>('add_listing')",
  "const [activeTab, setActiveTab] = useState<'overview' | 'add_listing' | 'bulk_upload' | 'portfolio' | 'earnings'>('overview')"
);
newContent = newContent.replace(/setActiveTab\('my_assignments'\)/g, "setActiveTab('portfolio')");
newContent = newContent.replace(/activeTab === 'my_assignments'/g, "activeTab === 'portfolio'");

const topPartEndIndex = newContent.indexOf('const renderNavButtons = () => {');
const mainReturnIndex = newContent.indexOf('return (\n    <div className="min-h-screen');

if (topPartEndIndex === -1 || mainReturnIndex === -1) {
    console.log("Failed to find boundaries");
    process.exit(1);
}

const topPart = newContent.substring(0, topPartEndIndex);

// Add missing Wallet icon
let finalTopPart = topPart.replace("Edit2,", "Edit2, Wallet,");

// Now we build the new layout body
const newLayout = \
  const NAV_ITEMS = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'add_listing', icon: Plus, label: editingListingId ? 'Edit Listing' : 'Add Listing' },
    { id: 'bulk_upload', icon: UploadCloud, label: 'Bulk Upload' },
    { id: 'portfolio', icon: Store, label: 'My Portfolio' },
    { id: 'earnings', icon: Wallet, label: 'Earnings & Commission' },
  ]

  const totalListings = listingsData?.listings?.length || 0;
  // Estimated earnings
  const estListingEarnings = totalListings * 200; // 200 INR per listing
  const estBannerEarnings = 0; // banners currently not tracked for agents in this mock
  const totalEarnings = estListingEarnings + estBannerEarnings;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 md:pb-0">
      
      {/* Mobile Swipeable Menu */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10 w-full overflow-x-auto snap-x hide-scrollbar">
        <div className="flex p-2 gap-2 w-max">
          {NAV_ITEMS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); if (tab.id !== 'add_listing') setEditingListingId(null); }}
                className={\lex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all snap-start
                  \\}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop Sidebar (Left 20%) */}
      <div className="hidden md:flex flex-col w-[20%] bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#4169E1]/10 text-[#4169E1] rounded-xl">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Agent CRM</h1>
              <p className="text-sm font-semibold text-[#4169E1]">Partner Portal</p>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); if (tab.id !== 'add_listing') setEditingListingId(null); }}
                className={\lex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all
                  \\}
              >
                <Icon className="size-5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content (Right 80%) */}
      <div className="flex-1 max-w-full md:max-w-[80%] overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 py-6 md:p-8">
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <Store className="size-8 text-[#4169E1] mb-4" />
                    <h3 className="text-3xl font-black">{totalListings}</h3>
                    <p className="text-gray-500 font-semibold text-sm">Total Listings Added</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <Image className="size-8 text-[#D4AF37] mb-4" />
                    <h3 className="text-3xl font-black">0</h3>
                    <p className="text-gray-500 font-semibold text-sm">Banners Sold</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <Eye className="size-8 text-green-500 mb-4" />
                    <h3 className="text-3xl font-black">0</h3>
                    <p className="text-gray-500 font-semibold text-sm">Generated Traffic</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'earnings' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900">Earnings & Commission</h2>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet className="size-32" /></div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-2">Total Estimated Earnings</p>
                  <h3 className="text-5xl font-black text-[#D4AF37] mb-6">?{totalEarnings.toLocaleString()}</h3>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                      <p className="text-gray-300 text-xs font-bold uppercase">Listings (20%)</p>
                      <p className="text-xl font-bold mt-1">?{estListingEarnings.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                      <p className="text-gray-300 text-xs font-bold uppercase">Banners (15%)</p>
                      <p className="text-xl font-bold mt-1">?{estBannerEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                   <Clock className="size-12 text-gray-300 mx-auto mb-4" />
                   <h3 className="text-xl font-bold text-gray-900">Next Payout: 1st of Next Month</h3>
                   <p className="text-gray-500 mt-2">All commissions are automatically calculated and processed at the start of the next month.</p>
                </div>
              </motion.div>
            )}

\;

// Now extract the old tabs content (add_listing, bulk_upload, my_assignments -> portfolio)
const addListingStart = newContent.indexOf("{activeTab === 'add_listing' && (");
const bulkUploadStart = newContent.indexOf("{activeTab === 'bulk_upload' && (");
const myAssignmentsStart = newContent.indexOf("{activeTab === 'portfolio' && (");
const animatePresenceEnd = newContent.indexOf("</AnimatePresence>");

const addListingCode = newContent.substring(addListingStart, bulkUploadStart);
const bulkUploadCode = newContent.substring(bulkUploadStart, myAssignmentsStart);
const portfolioCode = newContent.substring(myAssignmentsStart, animatePresenceEnd);

const finalCode = finalTopPart + newLayout + addListingCode + bulkUploadCode + portfolioCode + \
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
\;

fs.writeFileSync('src/components/agent-dashboard.tsx', finalCode);
console.log("Rewrite complete!");
