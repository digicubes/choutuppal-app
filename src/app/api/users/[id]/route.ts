import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Ensure we are updating valid fields
    const dataToUpdate: any = {}
    if (body.fullName !== undefined) dataToUpdate.fullName = body.fullName
    if (body.bio !== undefined) dataToUpdate.bio = body.bio
    if (body.whatsappNumber !== undefined) dataToUpdate.whatsappNumber = body.whatsappNumber
    if (body.avatarUrl !== undefined) dataToUpdate.avatarUrl = body.avatarUrl
    if (body.coverImage !== undefined) dataToUpdate.coverImage = body.coverImage
    if (body.isPublic !== undefined) dataToUpdate.isPublic = body.isPublic
    
    console.log('Updating user profile with:', dataToUpdate);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
