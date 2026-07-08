const fs = require('fs');
let code = fs.readFileSync('src/components/admin-view.tsx', 'utf8');

// Fix LayoutDashboard and ArrowLeft imports
code = code.replace(/import \{ LayoutDashboard, ArrowLeft, /g, 'import { ');
code = code.replace(/import \{ ArrowLeft, /g, 'import { ');

if (!code.includes('LayoutDashboard')) {
  code = code.replace(/import \{ Users, Store, /g, 'import { LayoutDashboard, ArrowLeft, Users, Store, ');
}

// Fix useState type if it exists
code = code.replace(/useState<'users' \| 'listings' \| 'banners' \| 'news' \| 'realestate' \| 'announcements' \| 'blogs'>/g, 
  "useState<'overview' | 'users' | 'listings' | 'banners' | 'news' | 'realestate' | 'announcements' | 'blogs'>");

// Let's also check if it's inferred by the lack of explicit type. 
// If it's `const [activeTab, setActiveTab] = useState('users')`, I changed it to `useState('overview')` which narrows the type to just `'overview'` if there is no explicit type, but wait... 
// In TS, `useState('overview')` makes `activeTab` of type `string` (actually `string`), but if it was `useState<'users' | ...>('overview')` it would fail if overview wasn't there.
// If the error says "the types '"listings" | "banners" | "news" | "users" | "realestate" | "announcements" | "blogs"' and '"overview"' have no overlap." it definitely has an explicit generic type.
// Let's replace the explicit type anywhere it occurs.

// Actually, I can just find the useState line:
code = code.replace(/useState<([\s\S]*?)>\('overview'\)/g, function(match, types) {
    if (!types.includes("'overview'")) {
        return `useState<'overview' | ${types}>('overview')`;
    }
    return match;
});

// Or maybe it was `useState<'users' | ...>('users')` and my previous script just did `useState<'users' | ...>('overview')` ?
code = code.replace(/useState<\s*'(?:users|listings|banners|news|realestate|announcements|blogs)'\s*\|[\s\S]*?>\('overview'\)/, function(match) {
    return "useState<'overview' | 'users' | 'listings' | 'banners' | 'news' | 'realestate' | 'announcements' | 'blogs'>('overview')";
});


fs.writeFileSync('src/components/admin-view.tsx', code);
console.log('admin-view Fixes Applied!');
