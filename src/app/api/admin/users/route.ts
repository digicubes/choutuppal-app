import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, phone, password, role } = body;

    if (!fullName || !phone || !password) {
      return NextResponse.json({ error: 'Name, Phone, and Password are required.' }, { status: 400 });
    }

    // 1. Create in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email || undefined,
      password,
      phone,
      email_confirm: true,
      phone_confirm: true,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Create or Update in Prisma
    const user = await db.user.upsert({
      where: { id: userId },
      update: {
        fullName,
        email: email || undefined,
        phone,
        role: role || 'user',
      },
      create: {
        id: userId,
        fullName,
        email: email || undefined,
        phone,
        role: role || 'user',
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    console.error('Create User Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
