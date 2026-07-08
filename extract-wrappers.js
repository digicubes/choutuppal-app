const fs = require('fs');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// Use regex to remove ProtectedDashboard, ProtectedAdmin, ProtectedSuperAdmin
page = page.replace(/function ProtectedDashboard\(\) \{[\s\S]*?(?=function ProtectedAdmin\(\) \{)/, '');
page = page.replace(/function ProtectedAdmin\(\) \{[\s\S]*?(?=function ProtectedSuperAdmin\(\) \{)/, '');
page = page.replace(/function ProtectedSuperAdmin\(\) \{[\s\S]*?(?=\/\*\*[\s]*\* CityPage)/, '');

// Add the dynamic imports for these three views
const dynamicImports = `
const ProtectedDashboard = dynamic(() => import('@/components/protected-wrappers').then(mod => mod.ProtectedDashboard), { ssr: false })
const ProtectedAdmin = dynamic(() => import('@/components/protected-wrappers').then(mod => mod.ProtectedAdmin), { ssr: false })
const ProtectedSuperAdmin = dynamic(() => import('@/components/protected-wrappers').then(mod => mod.ProtectedSuperAdmin), { ssr: false })
`;

// Insert the dynamic imports around line 35, near other dynamic imports.
// Look for `const AgentDashboard = dynamic(` and insert before it
if (!page.includes('const ProtectedDashboard = dynamic')) {
  page = page.replace(/const AgentDashboard = dynamic\(/, dynamicImports + "\nconst AgentDashboard = dynamic(");
}

fs.writeFileSync('src/app/page.tsx', page);
console.log('page.tsx updated with dynamic imports for protected wrappers');
