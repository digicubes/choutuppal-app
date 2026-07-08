const fs = require('fs');

function patchAdminView() {
  let file = 'src/components/admin-view.tsx';
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('import { supabase }')) {
    content = content.replace("import { GlassCard } from '@/components/glass-card'", "import { GlassCard } from '@/components/glass-card'\nimport { supabase } from '@/lib/supabase'");
  }

  // Find the fetchData Promise.allSettled and add auth headers
  content = content.replace(
    /fetch\(\`\$\{ep\.url\}\?t=\$\{Date\.now\(\)\}\`, \{ credentials: 'include' \}\)/,
    `(async () => {
          const { data: { session } } = await supabase.auth.getSession()
          return fetch(\`\${ep.url}?t=\${Date.now()}\`, { 
            credentials: 'include',
            headers: session?.access_token ? { 'Authorization': 'Bearer ' + session.access_token } : {}
          })
        })()`
  );

  // Patch delete methods
  content = content.replace(
    /await fetch\('([^']+)' \+ id, \{ method: 'DELETE', credentials: 'include' \}\)/g,
    `await (async () => {
        const { data: { session } } = await supabase.auth.getSession()
        return fetch('$1' + id, { 
          method: 'DELETE', 
          credentials: 'include',
          headers: session?.access_token ? { 'Authorization': 'Bearer ' + session.access_token } : {}
        })
      })()`
  );

  // Patch handleSaveBranding
  content = content.replace(
    /headers: \{ 'Content-Type': 'application\/json' \},/g,
    `headers: { 'Content-Type': 'application/json', ...(await supabase.auth.getSession()).data.session?.access_token ? { 'Authorization': 'Bearer ' + (await supabase.auth.getSession()).data.session?.access_token } : {} },`
  );

  fs.writeFileSync(file, content);
  console.log('Patched ' + file);
}

patchAdminView();
