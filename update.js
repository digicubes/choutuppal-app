const fs = require('fs');
let code = fs.readFileSync('src/components/admin-view.tsx', 'utf8');

if (!code.includes('import { ForbiddenPage }')) {
  code = code.replace(/import \{ Home \} from 'lucide-react'/, 'import { Home, AlertTriangle } from \'lucide-react\'\nimport { ForbiddenPage } from \'@/components/auth/forbidden-page\'');
}

if (!code.includes('const [isMounted, setIsMounted] = useState(false)')) {
  code = code.replace(/const \[activeTab, setActiveTab\] = useState/, 'const [isMounted, setIsMounted] = useState(false)\n  const [activeTab, setActiveTab] = useState');
}

const authLogic = \
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="flex h-screen items-center justify-center font-bold text-gray-500">Loading Admin Panel...</div>;
  }

  const role = user?.role?.toLowerCase() || '';
  if (role !== 'super_admin' && role !== 'city_admin' && role !== 'admin') {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="max-w-7xl mx-auto">
          <div className="mx-4 mt-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-700">
            <AlertTriangle className="size-4 shrink-0" />
            Dev Mode: Viewing admin panel as non-admin user.
          </div>
          <ForbiddenPage />
        </div>
      )
    }
    return <ForbiddenPage />
  }
\;

if (!code.includes('if (!isMounted) {')) {
  code = code.replace(/  useEffect\(\(\) => \{\n    fetchData\(\)\n  \}, \[\]\)/, authLogic + '\n  useEffect(() => {\n    fetchData()\n  }, [])');
}

fs.writeFileSync('src/components/admin-view.tsx', code);
console.log('Successfully updated admin-view.tsx');
