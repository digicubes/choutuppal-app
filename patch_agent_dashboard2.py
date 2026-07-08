import re

file_path = 'src/components/agent-dashboard.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

logo_img = '''                              <>
                                <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                                <button onClick={() => setFormData(p => ({...p, logoUrl: ''}))} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-500 hover:bg-red-500 hover:text-white z-10 shadow"><Trash2 className="size-4" /></button>
                              </>'''
content = re.sub(r'\{formData\.logoUrl \? \([\s\S]*?className=\"size-4\" \/><\/button>\s*<\/>', logo_img, content)

cover_img = '''                              <>
                                <img src={formData.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                                <button onClick={() => setFormData(p => ({...p, coverImage: ''}))} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-500 hover:bg-red-500 hover:text-white z-10 shadow"><Trash2 className="size-4" /></button>
                              </>'''
content = re.sub(r'\{formData\.coverImage \? \([\s\S]*?className=\"size-4\" \/><\/button>\s*<\/>', cover_img, content)

gallery_img = '''                          {formData.galleryUrls.map((url, i) => (
                            <div key={i} className="min-w-[120px] h-[120px] relative border rounded-xl overflow-hidden shadow-sm group">
                              <img src={url} alt={`Gallery Preview ${i}`} className="w-full h-full object-cover" />
                              <button onClick={() => setFormData(p => ({...p, galleryUrls: p.galleryUrls.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-red-500 hover:text-white shadow z-10"><Trash2 className="size-3" /></button>
                            </div>
                          ))}'''
content = re.sub(r'\{formData\.galleryUrls\.map\(\(url, i\) => \(\s*<div key=\{i\} className=\"min-w-\[120px\] h-\[120px\] relative border rounded-xl overflow-hidden shadow-sm\">\s*\)\)\}', gallery_img, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched agent-dashboard.tsx')
