const fs = require('fs');
const files = [
  'src/components/dashboard-view.tsx',
  'src/components/listing-card.tsx',
  'src/components/admin-listings.tsx',
  'src/components/admin-banners.tsx',
  'src/components/admin-news.tsx'
];
files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  // Simple replace: replace `<img ` with `<img loading="lazy" decoding="async" `
  // Only if they don't already have loading=
  let newContent = content.replace(/<img(?!([^>]+)?loading=)([^>]+)>/g, '<img loading="lazy" decoding="async"$2>');
  if (newContent !== content) {
    fs.writeFileSync(file, newContent);
    console.log('Updated', file);
  }
});
