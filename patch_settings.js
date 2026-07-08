const fs = require('fs');
let file = 'src/app/api/settings/route.ts';
let content = fs.readFileSync(file, 'utf8');

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
    
    let session: any = null;
    let authUser: any = null;
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
      console.error('Session failed to parse in API: /api/settings')
    }
`;

content = content.replace(/const cookieStore = await cookies\(\)[\s\S]*?if \(!session\) \{\s*console\.error\('Session failed to parse in API: \/api\/settings'\)\s*\}/g, newAuthLogic);

fs.writeFileSync(file, content);
console.log('Patched settings route');
