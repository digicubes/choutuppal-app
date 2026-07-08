const fs = require('fs');
let code = fs.readFileSync('src/components/admin-view.tsx', 'utf8');

// 1. Refactor AddListingModal to AddListingForm
code = code.replace(/function AddListingModal\(\{ open, onOpenChange, onSuccess \}: any\) \{([\s\S]*?)return \(\s*<Dialog open=\{open\} onOpenChange=\{onOpenChange\}>\s*<DialogContent[^>]*>([\s\S]*?)<\/DialogContent>\s*<\/Dialog>\s*\)/, function(match, body, content) {
    content = content.replace(/<Button variant="ghost" size="icon" className="md:hidden" onClick=\{[^\}]+\}><X className="w-5 h-5"\/><\/Button>/g, '<Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>');
    content = content.replace(/<Button variant="ghost" size="icon" className="hidden md:flex absolute top-4 right-4" onClick=\{[^\}]+\}><X className="w-5 h-5"\/><\/Button>/g, '');
    content = content.replace(/<DialogTitle/g, '<h2');
    content = content.replace(/<\/DialogTitle>/g, '</h2>');
    return `function AddListingForm({ onOpenChange, onSuccess }: any) {${body}return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 overflow-hidden flex flex-col relative w-full">${content}</div>
  )`;
});

// 2. Refactor AddNewsModal
code = code.replace(/export function AddNewsModal\(\{ open, onOpenChange, onSuccess \}: any\) \{([\s\S]*?)return \(\s*<Dialog open=\{open\} onOpenChange=\{onOpenChange\}>\s*<DialogContent[^>]*>([\s\S]*?)<\/DialogContent>\s*<\/Dialog>\s*\)/, function(match, body, content) {
    content = content.replace(/<Button variant="ghost" size="icon" className="md:hidden" onClick=\{[^\}]+\}><X className="w-5 h-5"\/><\/Button>/g, '<Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>');
    content = content.replace(/<Button variant="ghost" size="icon" className="hidden md:flex absolute top-4 right-4" onClick=\{[^\}]+\}><X className="w-5 h-5"\/><\/Button>/g, '');
    content = content.replace(/<DialogTitle/g, '<h2');
    content = content.replace(/<\/DialogTitle>/g, '</h2>');
    return `export function AddNewsForm({ onOpenChange, onSuccess }: any) {${body}return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 overflow-hidden flex flex-col relative w-full">${content}</div>
  )`;
});

// 3. Refactor AddBlogModal
code = code.replace(/export function AddBlogModal\(\{ open, onOpenChange, onSuccess \}: any\) \{([\s\S]*?)return \(\s*<Dialog open=\{open\} onOpenChange=\{onOpenChange\}>\s*<DialogContent[^>]*>([\s\S]*?)<\/DialogContent>\s*<\/Dialog>\s*\)/, function(match, body, content) {
    content = content.replace(/<Button variant="ghost" size="icon" className="md:hidden" onClick=\{[^\}]+\}><X className="w-5 h-5"\/><\/Button>/g, '<Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>');
    content = content.replace(/<Button variant="ghost" size="icon" className="hidden md:flex absolute top-4 right-4" onClick=\{[^\}]+\}><X className="w-5 h-5"\/><\/Button>/g, '');
    content = content.replace(/<DialogTitle/g, '<h2');
    content = content.replace(/<\/DialogTitle>/g, '</h2>');
    return `export function AddBlogForm({ onOpenChange, onSuccess }: any) {${body}return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 overflow-hidden flex flex-col relative w-full">${content}</div>
  )`;
});

// 4. Refactor AddRealEstateModal
code = code.replace(/function AddRealEstateModal\(\{ open, onOpenChange, onSuccess \}: any\) \{([\s\S]*?)return \(\s*<Dialog open=\{open\} onOpenChange=\{onOpenChange\}>\s*<DialogContent[^>]*>([\s\S]*?)<\/DialogContent>\s*<\/Dialog>\s*\)/, function(match, body, content) {
    content = content.replace(/<DialogHeader>/g, '<div className="flex justify-between items-center mb-4">');
    content = content.replace(/<\/DialogHeader>/g, '<Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button></div>');
    content = content.replace(/<DialogTitle/g, '<h2');
    content = content.replace(/<\/DialogTitle>/g, '</h2>');
    return `function AddRealEstateForm({ onOpenChange, onSuccess }: any) {${body}return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4 flex flex-col relative w-full">${content}</div>
  )`;
});

// Update the render logic in admin-view main component
code = code.replace(/<AddListingModal open=\{isAddingListing\} onOpenChange=\{setIsAddingListing\} onSuccess=\{fetchData\} \/>/g, '');
code = code.replace(/<AddRealEstateModal open=\{isAddingRealEstate\} onOpenChange=\{setIsAddingRealEstate\} onSuccess=\{fetchData\} \/>/g, '');
code = code.replace(/<AddNewsModal open=\{isAddingNews\} onOpenChange=\{setIsAddingNews\} onSuccess=\{fetchData\} \/>/g, '');
code = code.replace(/<AddBlogModal open=\{isAddingBlog\} onOpenChange=\{setIsAddingBlog\} onSuccess=\{fetchData\} \/>/g, '');

// Inline forms
code = code.replace(/\{activeTab === 'listings' && \(\s*<div className="space-y-4">\s*<div className="flex justify-between items-center">/, 
"{activeTab === 'listings' && isAddingListing ? <AddListingForm onOpenChange={setIsAddingListing} onSuccess={() => { setIsAddingListing(false); fetchData(); }} /> : activeTab === 'listings' && (<div className=\"space-y-4\"><div className=\"flex justify-between items-center\">");

code = code.replace(/\{activeTab === 'realestate' && \(\s*<div className="space-y-4">\s*<div className="flex justify-between items-center">/, 
"{activeTab === 'realestate' && isAddingRealEstate ? <AddRealEstateForm onOpenChange={setIsAddingRealEstate} onSuccess={() => { setIsAddingRealEstate(false); fetchData(); }} /> : activeTab === 'realestate' && (<div className=\"space-y-4\"><div className=\"flex justify-between items-center\">");

code = code.replace(/\{activeTab === 'news' && \(\s*<div className="space-y-4">\s*<div className="flex justify-between items-center">/, 
"{activeTab === 'news' && isAddingNews ? <AddNewsForm onOpenChange={setIsAddingNews} onSuccess={() => { setIsAddingNews(false); fetchData(); }} /> : activeTab === 'news' && (<div className=\"space-y-4\"><div className=\"flex justify-between items-center\">");

code = code.replace(/\{activeTab === 'blogs' && \(\s*<div className="space-y-4">\s*<div className="flex justify-between items-center">/, 
"{activeTab === 'blogs' && isAddingBlog ? <AddBlogForm onOpenChange={setIsAddingBlog} onSuccess={() => { setIsAddingBlog(false); fetchData(); }} /> : activeTab === 'blogs' && (<div className=\"space-y-4\"><div className=\"flex justify-between items-center\">");

fs.writeFileSync('src/components/admin-view.tsx', code);
console.log('admin-view Refactored successfully!');
