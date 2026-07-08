'use server'

import { db } from '@/lib/db'
import { createClient } from '@supabase/supabase-js'

export async function deleteMyAccount(userId: string) {
  if (!userId) {
    throw new Error('User ID is required')
  }

  // Use service role key to delete from Auth
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Delete from Prisma (assuming cascade or we might need to delete related data)
    await db.user.delete({
      where: { id: userId }
    })

    // Delete from Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) {
      console.error('Failed to delete Supabase auth user:', error)
      // Even if it fails, we deleted the profile, but we should throw
      throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete account:', error)
    return { success: false, error: error.message }
  }
}
