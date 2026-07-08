const fs = require('fs');
let code = fs.readFileSync('src/components/admin-view.tsx', 'utf8');

// 1. Refactor AddBannerModal to AddBannerForm
code = code.replace(/function AddBannerModal\(\{ open, onOpenChange, onSuccess \}: any\) \{([\s\S]*?)return \(\s*<Dialog open=\{open\} onOpenChange=\{onOpenChange\}>\s*<DialogContent[^>]*>([\s\S]*?)<\/DialogContent>\s*<\/Dialog>\s*\)/, function(match, body, content) {
    content = content.replace(/<Button variant="ghost" size="icon" className="md:hidden" onClick=\{[^\}]+\}><X className="w-5 h-5"\/><\/Button>/g, '<Button variant="outline" className="text-gray-600 rounded-xl" onClick={() => onOpenChange(false)}><ArrowLeft className="w-4 h-4 mr-2" /> Cancel</Button>');
    content = content.replace(/<Button variant="ghost" size="icon" className="hidden md:flex absolute top-4 right-4" onClick=\{[^\}]+\}><X className="w-5 h-5"\/><\/Button>/g, '');
    content = content.replace(/<DialogTitle/g, '<h2');
    content = content.replace(/<\/DialogTitle>/g, '</h2>');
    return `function AddBannerForm({ onOpenChange, onSuccess }: any) {${body}return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 overflow-hidden flex flex-col relative w-full">${content}</div>
  )`;
});

// 2. Refactor AddAnnouncementModal to AddAnnouncementForm
code = code.replace(/function AddAnnouncementModal\(\{ open, onOpenChange, onSuccess \}: any\) \{([\s\S]*?)return \(\s*<Dialog open=\{open\} onOpenChange=\{onOpenChange\}>\s*<DialogContent[^>]*>([\s\S]*?)<\/DialogContent>\s*<\/Dialog>\s*\)/, function(match, body, content) {
    content = content.replace(/<DialogHeader>/g, '<div className="flex justify-between items-center mb-4">');
    content = content.replace(/<\/DialogHeader>/g, '<Button variant="outline" className="text-gray-600 rounded-xl" onClick={() => onOpenChange(false)}><ArrowLeft className="w-4 h-4 mr-2" /> Cancel</Button></div>');
    content = content.replace(/<DialogTitle/g, '<h2');
    content = content.replace(/<\/DialogTitle>/g, '</h2>');
    return `function AddAnnouncementForm({ onOpenChange, onSuccess }: any) {${body}return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4 flex flex-col relative w-full">${content}</div>
  )`;
});

// Remove leftover modal components inside admin-view return statement
code = code.replace(/<AddBannerModal open=\{isAddingBanner\} onOpenChange=\{setIsAddingBanner\} onSuccess=\{fetchData\} \/>/g, '');
code = code.replace(/<AddAnnouncementModal open=\{isAddingAnnouncement\} onOpenChange=\{setIsAddingAnnouncement\} onSuccess=\{fetchData\} \/>/g, '');

// Inline forms implementation in tab renders
code = code.replace(/\{activeTab === 'banners' && \(\s*<div className="space-y-4">\s*<div className="flex justify-between items-center">/, 
"{activeTab === 'banners' && isAddingBanner ? <AddBannerForm onOpenChange={setIsAddingBanner} onSuccess={() => { setIsAddingBanner(false); fetchData(); }} /> : activeTab === 'banners' && (<div className=\"space-y-4\"><div className=\"flex justify-between items-center\">");

code = code.replace(/\{activeTab === 'announcements' && \(\s*<div className="space-y-4">\s*<div className="flex justify-between items-center">/, 
"{activeTab === 'announcements' && isAddingAnnouncement ? <AddAnnouncementForm onOpenChange={setIsAddingAnnouncement} onSuccess={() => { setIsAddingAnnouncement(false); fetchData(); }} /> : activeTab === 'announcements' && (<div className=\"space-y-4\"><div className=\"flex justify-between items-center\">");

// 3. Add 'Overview' tab
// First, add LayoutDashboard icon to imports if not there
if (!code.includes('LayoutDashboard')) {
  code = code.replace(/import \{/, 'import { LayoutDashboard, ArrowLeft,');
} else {
  if (!code.includes('ArrowLeft')) {
    code = code.replace(/import \{/, 'import { ArrowLeft,');
  }
}

// Ensure Overview tab button is rendered first in mobile and desktop sidebars
code = code.replace(/<TabButton active=\{activeTab === 'users'\}/, "<TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={LayoutDashboard} label=\"Overview\" />\n        <TabButton active={activeTab === 'users'}");
code = code.replace(/<SidebarButton active=\{activeTab === 'users'\}/, "<SidebarButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={LayoutDashboard} label=\"Overview\" />\n        <SidebarButton active={activeTab === 'users'}");

// Create Overview layout rendering block
const overviewBlock = `
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <Users className="w-8 h-8 text-blue-500 mb-2" />
                <h3 className="text-3xl font-black text-gray-900">{users.length}</h3>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Total Users</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <Store className="w-8 h-8 text-purple-500 mb-2" />
                <h3 className="text-3xl font-black text-gray-900">{listings.length}</h3>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Listings</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <ImageIcon className="w-8 h-8 text-orange-500 mb-2" />
                <h3 className="text-3xl font-black text-gray-900">{banners.length}</h3>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Active Banners</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <Megaphone className="w-8 h-8 text-green-500 mb-2" />
                <h3 className="text-3xl font-black text-gray-900">{announcements.length}</h3>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Announcements</p>
              </div>
            </div>
          </div>
        )}
`;

code = code.replace(/<div className="flex-1 p-4 md:p-8 overflow-y-auto">\s*\{activeTab === 'users'/, `<div className="flex-1 p-4 md:p-8 overflow-y-auto">\n${overviewBlock}\n        {activeTab === 'users'`);

// Change default activeTab from 'users' (if it is) to 'overview'
code = code.replace(/const \[activeTab, setActiveTab\] = useState\('users'\)/, "const [activeTab, setActiveTab] = useState('overview')");

fs.writeFileSync('src/components/admin-view.tsx', code);
console.log('admin-view Refactored successfully!');
