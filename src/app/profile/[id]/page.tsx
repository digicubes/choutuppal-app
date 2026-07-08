import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { UserProfileView } from '@/components/user-profile-view'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  let user: any = null
  try {
    user = await prisma.user.findUnique({
      where: { id }
    })
  } catch {}

  if (!user) return { title: 'Profile Not Found' }

  const roleLabel = user.role === 'city_admin' ? 'City Admin' : user.role === 'agent' ? 'Agent' : 'Business Owner'
  const title = `${user.fullName} | ${roleLabel} | Choutuppal App`
  const description = user.bio || `View ${user.fullName}'s profile, listings, and stories on Choutuppal App.`
  
  const rawImage = user.coverImage || user.avatarUrl || '/og-default.png'
  const absoluteImageUrl = rawImage.startsWith('/') 
    ? `https://choutuppal.in${rawImage}` 
    : rawImage

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: absoluteImageUrl, width: 800, height: 800 }],
      type: 'profile',
      url: `https://choutuppal.in/profile/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: absoluteImageUrl, width: 800, height: 800 }],
    }
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log('Profile Page Loaded with ID:', id)
  
  let user: any = null

  try {
    user = await prisma.user.findUnique({
      where: { id },
      include: {
        listings: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
        },
        stories: {
          where: { expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
        },
        posts: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
        }
      }
    })
  } catch (err) {
    console.error('Error fetching profile:', err)
  }

  if (!user) {
    console.log('User not found in DB for ID:', id, 'Redirecting to home.')
    redirect('/')
  }

  // Without server session readily available, default initialIsFollowing to false
  // The client can re-verify or handle toggles.
  return <UserProfileView user={user} initialIsFollowing={false} />
}
