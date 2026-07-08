const fs = require('fs');
let code = fs.readFileSync('src/components/agent-dashboard.tsx', 'utf8');

// 1. Role Security
code = code.replace(
  "if (!user) {",
  \const role = user?.role?.toLowerCase() || '';
  if (!user || role !== 'agent') {
    return <ForbiddenPage />
  }
  if (!user) {\
);

// 2. Change Tabs
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'add_listing' | 'bulk_upload' | 'my_assignments'>('add_listing')",
  "const [activeTab, setActiveTab] = useState<'overview' | 'add_listing' | 'bulk_upload' | 'portfolio' | 'earnings'>('overview')"
);

// 3. Update activeTab assignments
code = code.replace(/setActiveTab\('my_assignments'\)/g, "setActiveTab('portfolio')");

// 4. Update the layout
// We need to replace renderNavButtons with the sidebar layout
const oldNavBlockRegex = /const renderNavButtons = \(\) => \{(?:.|\n)*?return \((?:.|\n)*?\} \/\* End renderNavButtons \*\//m;
// Actually I'll just rewrite the layout structure.

// Wait, doing this via regex might be tricky. Let's just create a new file based on the old one.
