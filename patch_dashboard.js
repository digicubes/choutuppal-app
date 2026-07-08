const fs = require('fs');

function patchDashboardView() {
  let file = 'src/components/dashboard-view.tsx';
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('const authFetch')) {
    const authFetchLogic = `
  const authFetch = async (url: string, options: any = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { ...options.headers };
    if (session?.access_token) {
      headers['Authorization'] = 'Bearer ' + session.access_token;
    }
    return fetch(url, { ...options, credentials: 'include', headers });
  };
`;
    // Insert after const [user, setUser] = useState<any>(null) or something similar
    content = content.replace(
      /export default function DashboardView\(\) \{/,
      "export default function DashboardView() {\n" + authFetchLogic
    );
  }

  // Replace fetch calls
  content = content.replace(/const fetcher = \(url: string\) => fetch\(url, \{ credentials: 'include' \}\)\.then\(res => res\.json\(\)\)/, "const fetcher = (url: string) => authFetch(url).then(res => res.json())");
  
  // For other fetches:
  content = content.replace(/await fetch\(/g, "await authFetch(");
  // Revert any fetch calls outside component if any, but there probably aren't any
  
  // The fetch on line 262 is not awaited: `fetch('/api/admin/categories?active=true', { credentials: 'include' })`
  content = content.replace(/fetch\('\/api\/admin\/categories/g, "authFetch('/api/admin/categories");

  fs.writeFileSync(file, content);
  console.log('Patched ' + file);
}

patchDashboardView();
