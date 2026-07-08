const fs = require('fs');

const directUploadLogic = `
    const { data, error } = await supabase.storage
      .from('listing-images')
      .upload(\`\${folder}/\${Date.now()}_\${fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '')}\`, fileToUpload, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('Upload error:', error);
      throw new Error('Upload failed');
    }
    const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(data.path);
    return { url: urlData.publicUrl };
`;

const mediaUploaderLogic = `
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90))
      }, 500)

      const { data, error } = await supabase.storage
        .from('listing-images')
        .upload(\`\${folder}/\${Date.now()}_\${fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '')}\`, fileToUpload, { cacheControl: '3600', upsert: false });

      clearInterval(progressInterval)
      setProgress(100)

      if (error) {
        console.error('Upload error:', error);
        throw new Error('Upload failed');
      }
      
      const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;
      const result = { url: publicUrl };
`;


function patchFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf-8');
  
  if (!content.includes("import { supabase } from '@/lib/supabase'") && content.includes('/api/upload')) {
     content = content.replace("import React,", "import React,\nimport { supabase } from '@/lib/supabase'");
     if (!content.includes("import { supabase } from '@/lib/supabase'")) {
       content = `import { supabase } from '@/lib/supabase'\n` + content;
     }
  }

  // Dashboard-view, Admin-view, City-admin-dashboard pattern:
  const fetchUploadPattern = /const uploadData = new FormData\(\)[\s\S]*?return await res\.json\(\)/g;
  content = content.replace(fetchUploadPattern, directUploadLogic.trim());
  
  // Media-uploader pattern:
  const mediaUploaderPattern = /\/\/ Simulate progress[\s\S]*?const res = await fetch\('\/api\/upload'[\s\S]*?throw new Error\(errData\.error \|\| 'Upload failed'\)\n\s*\}/g;
  if (content.includes('setProgress')) {
    content = content.replace(mediaUploaderPattern, mediaUploaderLogic.trim());
  }

  // Final catch for any direct fetch statements
  content = content.replace(/const res = await fetch\('\/api\/upload'[\s\S]*?body: uploadData \}\)/g, directUploadLogic.trim());

  fs.writeFileSync(filepath, content, 'utf-8');
  console.log('Patched', filepath);
}

patchFile('src/components/dashboard-view.tsx');
patchFile('src/components/admin-view.tsx');
patchFile('src/components/city-admin-dashboard.tsx');
patchFile('src/components/media-uploader.tsx');

