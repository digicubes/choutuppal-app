const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/app/page.tsx',
  'src/app/city/[cityName]/page.tsx'
];

function getApiRoutes(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getApiRoutes(fullPath, fileList);
    } else if (file === 'route.ts' || file === 'route.js') {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const apiDir = path.join(__dirname, '../src/app/api');
if (fs.existsSync(apiDir)) {
  const apiRoutes = getApiRoutes(apiDir);
  targetFiles.push(...apiRoutes.map(p => path.relative(path.join(__dirname, '..'), p).replace(/\\/g, '/')));
}

const exportString = "export const dynamic = 'force-dynamic';";

for (const relPath of targetFiles) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes(exportString)) {
      // Avoid strict mode conflicts, insert after imports if possible, or just prepend
      // But standard practice is placing it near the top
      content = exportString + "\n" + content;
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log('Updated', relPath);
    }
  } else {
    console.warn('File not found:', relPath);
  }
}
console.log('Done.');
