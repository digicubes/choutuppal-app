const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard-view.tsx', 'utf-8');

// 1. Add isPostMenuOpen state
content = content.replace(
  'const [isCreatingListing, setIsCreatingListing] = useState(false)',
  'const [isCreatingListing, setIsCreatingListing] = useState(false)\n  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false)'
);

// 2. Define the Post Menu popup
const postMenuHtml = `
      {/* Post Menu Popup */}
      <AnimatePresence>
        {isPostMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 flex items-end md:items-center justify-center p-4 md:p-0"
            onClick={() => setIsPostMenuOpen(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900">What do you want to post?</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsPostMenuOpen(false)} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => { setIsPostMenuOpen(false); setIsCreatingListing(true); setFormData(prev => ({...prev, category: ''})); }}
                  className="w-full flex items-center p-4 rounded-2xl border border-gray-100 hover:border-[#4169E1] hover:bg-blue-50 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Business Listing</h4>
                    <p className="text-sm text-gray-500">Add your shop, service, or business</p>
                  </div>
                </button>

                <button 
                  onClick={() => { setIsPostMenuOpen(false); setIsCreatingListing(true); setFormData(prev => ({...prev, category: 'Real Estate'})); }}
                  className="w-full flex items-center p-4 rounded-2xl border border-gray-100 hover:border-[#D4AF37] hover:bg-yellow-50 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-yellow-100 text-[#D4AF37] flex items-center justify-center mr-4">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Real Estate Property</h4>
                    <p className="text-sm text-gray-500">Sell or rent your property</p>
                  </div>
                </button>

                <button 
                  onClick={() => { setIsPostMenuOpen(false); setIsCreatingBanner(true); }}
                  className="w-full flex items-center p-4 rounded-2xl border border-gray-100 hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-4">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Banner Ad</h4>
                    <p className="text-sm text-gray-500">Promote offers on the home page</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
`;

// Insert the popup HTML at the end of the return statement
content = content.replace(
  '{/* Add Listing Full Screen Modal */}',
  postMenuHtml + '\n\n      {/* Add Listing Full Screen Modal */}'
);

// We need to import Building2 if not imported
if (!content.includes('Building2')) {
  content = content.replace('Store, ', 'Store, Building2, ');
  if (!content.includes('Building2')) {
    content = content.replace('import {', 'import { Building2,');
  }
}

// 3. Rewrite renderBusiness
const newRenderBusiness = `
  const renderBusiness = () => {
    const businessListings = listings.filter(l => l.category !== 'Real Estate');
    const realEstateListings = listings.filter(l => l.category === 'Real Estate');

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        
        {/* Card 1: My Business Listings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
              <Store className="w-5 h-5 mr-2 text-[#4169E1]" /> 
              My Listings
            </h3>
            <Button size="sm" onClick={() => setIsPostMenuOpen(true)} className="bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white font-bold rounded-xl shadow-md hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 mr-1" /> Add Listing
            </Button>
          </div>
          <div className="p-4 md:p-6">
            {loadingListings ? (
              <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
              </div>
            ) : businessListings.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-gray-900 font-bold mb-1">No listings yet</h4>
                <p className="text-gray-500 text-sm">Create your first business listing to reach customers.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {businessListings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                    <div className="flex p-4 gap-4">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gray-100 relative overflow-hidden shrink-0 border border-gray-200">
                        <Image src={listing.images ? JSON.parse(listing.images)[0] : (listing.coverImage || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image')} alt={listing.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-bold text-gray-900 md:text-lg truncate">{listing.name}</h4>
                          <p className="text-xs md:text-sm text-gray-500 truncate">{listing.category} • {listing.city?.name}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className={listing.isApproved ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}>
                            {listing.isApproved ? 'Active' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: My Real Estate */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-[#D4AF37]" /> 
              My Real Estate
            </h3>
            <Button size="sm" onClick={() => setIsPostMenuOpen(true)} className="bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white font-bold rounded-xl shadow-md hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 mr-1" /> Add Property
            </Button>
          </div>
          <div className="p-4 md:p-6">
            {loadingListings ? (
              <div className="space-y-4">
                {[1].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
              </div>
            ) : realEstateListings.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-gray-900 font-bold mb-1">No properties listed yet</h4>
                <p className="text-gray-500 text-sm">Sell or rent your real estate properties easily.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {realEstateListings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                    <div className="flex p-4 gap-4">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gray-100 relative overflow-hidden shrink-0 border border-gray-200">
                        <Image src={listing.images ? JSON.parse(listing.images)[0] : (listing.coverImage || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image')} alt={listing.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-bold text-gray-900 md:text-lg truncate">{listing.name}</h4>
                          <p className="text-xs md:text-sm text-gray-500 truncate">{listing.city?.name}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className={listing.isApproved ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}>
                            {listing.isApproved ? 'Active' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 3: My Banners */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-purple-600" /> 
              My Banners
            </h3>
            <Button size="sm" onClick={() => setIsPostMenuOpen(true)} className="bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white font-bold rounded-xl shadow-md hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 mr-1" /> Add Banner
            </Button>
          </div>
          <div className="p-4 md:p-6">
            {loadingBanners ? (
              <div className="space-y-4">
                {[1].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-gray-900 font-bold mb-1">No active banners</h4>
                <p className="text-gray-500 text-sm">Promote your business on the home page with a banner ad.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="h-32 relative bg-gray-100">
                      {banner.imageUrl && <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <h4 className="font-bold text-white md:text-lg truncate">{banner.title}</h4>
                        {banner.offerText && <p className="text-[#D4AF37] font-bold text-sm">{banner.offerText}</p>}
                      </div>
                    </div>
                    <div className="p-3 bg-white flex justify-between items-center">
                      <Badge className={banner.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button (FAB) - Hidden on Desktop */}
        <button 
          onClick={() => setIsPostMenuOpen(true)}
          className="fixed bottom-24 right-6 md:hidden w-16 h-16 rounded-full bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white shadow-[0_8px_30px_rgba(65,105,225,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
        >
          <Plus className="w-8 h-8 text-white" />
        </button>
      </div>
    )
  }
`;

// Replace the old renderBusiness definition
const renderBusinessStartIndex = content.indexOf('const renderBusiness = () => (');
const renderWalletStartIndex = content.indexOf('const renderWallet = () => (');

if (renderBusinessStartIndex !== -1 && renderWalletStartIndex !== -1) {
  content = content.substring(0, renderBusinessStartIndex) + newRenderBusiness + '\n\n  ' + content.substring(renderWalletStartIndex);
}

fs.writeFileSync('src/components/dashboard-view.tsx', content, 'utf-8');
console.log('Patched dashboard-view.tsx');
