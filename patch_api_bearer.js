const fs = require('fs');

const files = [
  'src/app/api/admin/users/route.ts',
  'src/app/api/settings/route.ts',
  'src/app/api/banners/route.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace the old auth check block with the new Bearer Token hybrid logic
  const oldAuthLogicRegex = /const cookieStore = await cookies\(\)[\s\S]*?if \(!session\) \{\s*console\.error\('Session failed to parse in API: '[^)]*\)\s*\}/g;

  const newAuthLogic = `
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
        },
      }
    )
    
    let session = null;
    let authUser = null;
    const authHeader = request?.headers?.get('authorization') || request?.headers?.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) {
        authUser = user;
        session = { user };
      }
    }
    
    if (!session) {
      const { data: sessionData } = await supabase.auth.getSession()
      session = sessionData?.session;
    }

    if (!session) {
      console.error('Session failed to parse in API: ' + (request?.url || '/api/settings'))
    }
`;

  content = content.replace(oldAuthLogicRegex, newAuthLogic);

  // For /api/settings/route.ts GET method which doesn't have request parameter
  // wait, the prompt says "Check req.headers.get('authorization')". 
  // If GET() in settings doesn't have a request parameter, it will crash because `request` is undefined!
  content = content.replace(/export async function GET\(\) \{/, 'export async function GET(request: Request) {');

  fs.writeFileSync(file, content);
  console.log('Patched ' + file);
});
