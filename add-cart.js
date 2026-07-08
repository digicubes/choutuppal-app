const fs = require('fs');
let code = fs.readFileSync('src/components/listing-view.tsx', 'utf8');

// Add cart state
code = code.replace(/const \[isImageModalOpen, setIsImageModalOpen\] = useState\(false\)/, 
  "const [isImageModalOpen, setIsImageModalOpen] = useState(false)\n  const [cart, setCart] = useState<{ [key: string]: number }>({})");

// Add ShoppingCart, Plus, Minus, ShoppingBag icons
if (!code.includes('ShoppingCart')) {
  code = code.replace(/import \{/, 'import { ShoppingCart, ShoppingBag, Minus, Plus,');
}

// Add add/remove cart handlers
const cartLogic = `
  const catalogItems = listing.catalogItems ? JSON.parse(listing.catalogItems) : []
  // fallback items if none found
  const displayItems = catalogItems.length > 0 ? catalogItems : [
    { id: '1', name: 'Sample Item 1', price: 99 },
    { id: '2', name: 'Sample Item 2', price: 149 }
  ]

  const totalCartItems = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalCartPrice = displayItems.reduce((acc, item) => {
    return acc + (item.price * (cart[item.id] || 0))
  }, 0)

  const handleWhatsAppOrder = () => {
    let orderText = \`Hello \${listing.name}! I would like to order:\\n\\n\`
    displayItems.forEach(item => {
      if (cart[item.id]) {
        orderText += \`- \${item.name} x\${cart[item.id]} (₹\${item.price * cart[item.id]})\\n\`
      }
    })
    orderText += \`\\n*Total: ₹\${totalCartPrice}*\\n\\nPlease confirm my order.\`
    
    // Also track click
    fetch(\`/api/listings/\${listing.id}/click\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'whatsapp' })
    }).catch(console.error)

    window.open(\`https://wa.me/\${listing.whatsappNumber}?text=\${encodeURIComponent(orderText)}\`, '_blank')
  }

  const renderCatalog = () => (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-[#4169E1]" /> Products / Menu
      </h3>
      <div className="grid gap-4">
        {displayItems.map((item: any) => (
          <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900">{item.name}</h4>
              <p className="text-[#D4AF37] font-bold">₹{item.price}</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1">
              <button 
                onClick={() => setCart(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:text-red-500"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold w-4 text-center">{cart[item.id] || 0}</span>
              <button 
                onClick={() => setCart(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:text-green-500"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
`;

code = code.replace(/const handleShare = async \(\) => \{/, cartLogic + "\n  const handleShare = async () => {");

// Render Catalog before Location
code = code.replace(/\{listing\.googleMapsUrl && \(/, "{renderCatalog()}\n\n          {listing.googleMapsUrl && (");

// Render Sticky Cart Button at the bottom
const stickyCart = `
      {/* Sticky Cart Button */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-safe left-0 right-0 p-4 z-50 bg-gradient-to-t from-white via-white to-transparent pb-24 md:pb-8 pointer-events-none">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <Button 
              onClick={handleWhatsAppOrder}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-lg h-14 rounded-2xl shadow-xl flex items-center justify-between px-6 transition-transform hover:scale-[1.02] active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  {totalCartItems}
                </div>
                <span>View Cart & Order</span>
              </div>
              <span>₹{totalCartPrice}</span>
            </Button>
          </div>
        </div>
      )}
`;

code = code.replace(/<\/div>\s*<\/div>\s*<\/main>/, "</div>\n        </div>\n      </main>\n" + stickyCart);

fs.writeFileSync('src/components/listing-view.tsx', code);
console.log('Cart system added successfully!');
