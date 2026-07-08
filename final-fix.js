const fs = require('fs');

// 1. admin-view.tsx
let adminView = fs.readFileSync('src/components/admin-view.tsx', 'utf8');
if (!adminView.includes('Settings,')) {
  adminView = adminView.replace(/import \{/, 'import { Settings,');
}
if (!adminView.includes('const renderBranding = () =>')) {
  const brandingLogic = `
  const [branding, setBranding] = useState<any>({})
  const [isSavingBranding, setIsSavingBranding] = useState(false)

  useEffect(() => {
    if (activeTab === 'branding') {
      fetch('/api/admin/branding')
        .then(res => res.json())
        .then(data => setBranding(data))
    }
  }, [activeTab])

  const handleSaveBranding = async () => {
    setIsSavingBranding(true)
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding)
      })
      if (res.ok) {
        toast.success('Branding updated successfully!')
      } else {
        toast.error('Failed to update branding')
      }
    } catch (e) {
      toast.error('Failed to update branding')
    } finally {
      setIsSavingBranding(false)
    }
  }

  const renderBranding = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">App Branding & Settings</h2>
        <Button onClick={handleSaveBranding} disabled={isSavingBranding} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md">
          {isSavingBranding ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>App Name</Label>
            <Input value={branding.appName || ''} onChange={e => setBranding({...branding, appName: e.target.value})} placeholder="Super App" />
          </div>
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input value={branding.tagline || ''} onChange={e => setBranding({...branding, tagline: e.target.value})} placeholder="Your Tagline" />
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input value={branding.logoUrl || ''} onChange={e => setBranding({...branding, logoUrl: e.target.value})} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Primary Color Hex</Label>
            <Input type="color" className="h-10 px-1 py-1" value={branding.primaryColorHex || '#4169E1'} onChange={e => setBranding({...branding, primaryColorHex: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp Number</Label>
            <Input value={branding.whatsappNumber || ''} onChange={e => setBranding({...branding, whatsappNumber: e.target.value})} placeholder="+91..." />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={branding.email || ''} onChange={e => setBranding({...branding, email: e.target.value})} placeholder="contact@..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Address</Label>
            <Input value={branding.address || ''} onChange={e => setBranding({...branding, address: e.target.value})} placeholder="123 Main St..." />
          </div>
        </div>
      </div>
    </div>
  )
  `;
  adminView = adminView.replace(/return \(\s*<div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pb-20 md:pb-0">/m, brandingLogic + "\n  return (\n    <div className=\"flex flex-col md:flex-row min-h-screen bg-gray-50 pb-20 md:pb-0\">");
}
fs.writeFileSync('src/components/admin-view.tsx', adminView);

// 2. dashboard-view.tsx
let dashboardView = fs.readFileSync('src/components/dashboard-view.tsx', 'utf8');
if (!dashboardView.includes('const renderAnalytics = () =>')) {
  dashboardView = dashboardView.replace(/return \(\s*<div className="min-h-screen/m, "const renderAnalytics = () => <div />\n  return (\n    <div className=\"min-h-screen");
}
fs.writeFileSync('src/components/dashboard-view.tsx', dashboardView);

// 3. listing-view.tsx
let listingView = fs.readFileSync('src/components/listing-view.tsx', 'utf8');
if (!listingView.includes('const [cart, setCart]')) {
  listingView = listingView.replace(/const navigateTo = useAppStore/m, "const [cart, setCart] = useState<Record<string, number>>({});\n  const navigateTo = useAppStore");
}
// Fix totalCartItems
listingView = listingView.replace(/Object\.values\(cart\)\.reduce\(\(a, b\) => a \+ b, 0\)/g, "Object.values(cart).reduce((a: any, b: any) => a + b, 0)");
listingView = listingView.replace(/Object\.values\(cart\)\.reduce\(\(a: number, b: number\) => a \+ b, 0\)/g, "Object.values(cart).reduce((a: any, b: any) => a + b, 0)");
fs.writeFileSync('src/components/listing-view.tsx', listingView);
