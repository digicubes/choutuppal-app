const fs = require('fs');
let code = fs.readFileSync('src/components/admin-view.tsx', 'utf8');

// Add Settings to icons
if (!code.includes('Settings')) {
  code = code.replace(/import \{ LayoutDashboard, ArrowLeft, Users, Store, /, 'import { LayoutDashboard, ArrowLeft, Users, Store, Settings, ');
}

// Add 'branding' to the activeTab type
code = code.replace(/useState<'overview' \| 'users' \| 'listings' \| 'realestate' \| 'banners' \| 'announcements' \| 'news' \| 'blogs'>/, 
  "useState<'overview' | 'users' | 'listings' | 'realestate' | 'banners' | 'announcements' | 'news' | 'blogs' | 'branding'>");

// Add Branding TabButton
code = code.replace(/<TabButton active=\{activeTab === 'users'\}/, 
  "<TabButton active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} icon={Settings} label=\"Branding\" />\n        <TabButton active={activeTab === 'users'}");

// Add Branding SidebarButton
code = code.replace(/<SidebarButton active=\{activeTab === 'users'\}/, 
  "<SidebarButton active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} icon={Settings} label=\"Branding\" />\n        <SidebarButton active={activeTab === 'users'}");

// Define Branding form state and effect
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

// Insert logic before return (
code = code.replace(/return \(\s*<div className="flex h-screen bg-gray-50">/, brandingLogic + "\n  return (\n    <div className=\"flex h-screen bg-gray-50\">");

// Render branding tab
code = code.replace(/\{activeTab === 'users' && \(/, "{activeTab === 'branding' && renderBranding()}\n        {activeTab === 'users' && (");

fs.writeFileSync('src/components/admin-view.tsx', code);
console.log('Admin Branding Tab Added successfully!');
