const fs = require('fs');

// 1. Fix API routes to use db as prisma
let routeFiles = [
  'src/app/api/admin/branding/route.ts',
  'src/app/api/listings/[id]/click/route.ts',
  'src/app/api/notifications/send/route.ts',
  'src/app/api/notifications/subscribe/route.ts'
];
for (let f of routeFiles) {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/import \{ prisma \} from '@\/lib\/db'/g, "import { db as prisma } from '@/lib/db'");
    fs.writeFileSync(f, content);
  }
}

// 2. Fix admin-view.tsx Settings
let adminView = fs.readFileSync('src/components/admin-view.tsx', 'utf8');
adminView = adminView.replace(/import \{ Settings,/, 'import { '); // remove from react if it went there
if (!adminView.includes('Settings')) {
  adminView = adminView.replace(/from 'lucide-react'/, ", Settings } from 'lucide-react'");
  adminView = adminView.replace(/} , Settings }/, ", Settings }");
}
fs.writeFileSync('src/components/admin-view.tsx', adminView);

// 3. Fix dashboard-view.tsx LineChart
let dashboardView = fs.readFileSync('src/components/dashboard-view.tsx', 'utf8');
dashboardView = dashboardView.replace(/import \{ LineChart,/g, 'import {'); // remove from react
if (!dashboardView.includes('LineChart,')) {
  dashboardView = dashboardView.replace(/from 'lucide-react'/, ", LineChart } from 'lucide-react'");
  dashboardView = dashboardView.replace(/} , LineChart }/, ", LineChart }");
}
fs.writeFileSync('src/components/dashboard-view.tsx', dashboardView);

// 4. Fix listing-view.tsx
let listingView = fs.readFileSync('src/components/listing-view.tsx', 'utf8');
listingView = listingView.replace(/import \{ ShoppingCart, ShoppingBag, Minus, Plus,/g, 'import {'); // remove from react
listingView = listingView.replace(/from 'lucide-react'/, ", ShoppingBag, Minus, Plus } from 'lucide-react'");
listingView = listingView.replace(/} , ShoppingBag/, ", ShoppingBag");

// Fix cart not defined
if (!listingView.includes('const [cart, setCart]')) {
  listingView = listingView.replace(/const \[isImageModalOpen/g, "const [cart, setCart] = useState<Record<string, number>>({});\n  const [isImageModalOpen");
}

// Fix listing possibly null
listingView = listingView.replace(/listing\.catalogItems/g, "listing?.catalogItems");
listingView = listingView.replace(/listing\.id/g, "listing?.id");
listingView = listingView.replace(/listing\.name/g, "listing?.name");
listingView = listingView.replace(/listing\.whatsappNumber/g, "listing?.whatsappNumber");

// Fix Object.values(cart) TS error
listingView = listingView.replace(/Object\.values\(cart\)\.reduce\(\(a, b\) => a \+ b, 0\)/g, "Object.values(cart).reduce((a: any, b: any) => a + b, 0)");

fs.writeFileSync('src/components/listing-view.tsx', listingView);
console.log('Final fixes applied!');
