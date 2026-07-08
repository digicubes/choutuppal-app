import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function DELETE(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Delete associated records via Cascade deletion by simply deleting the user
    await db.user.delete({ where: { id } });

    // Delete Supabase Auth afterwards
    await supabaseAdmin.auth.admin.deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete User Error:', err);
    return NextResponse.json({ error: 'Cannot delete user because they have protected associated records, or another database error occurred.' }, { status: 400 });
  }
}
