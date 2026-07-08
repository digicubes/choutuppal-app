import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { listingId, phoneNumber, userId } = await req.json()
    if (!listingId || !phoneNumber || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create the claim request
    const claimRequest = await db.claimRequest.create({
      data: {
        listingId,
        userId,
        phoneNumber,
        status: 'PENDING'
      }
    })

    return NextResponse.json(claimRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating claim request:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    // In a real app we'd check if user is ADMIN. Here we just return all.
    const claims = await db.claimRequest.findMany({
      include: {
        listing: true,
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(claims)
  } catch (error) {
    console.error('Error fetching claim requests:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, action } = await req.json() // action: 'approve' | 'reject'
    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })
    }

    const claim = await db.claimRequest.findUnique({ where: { id } })
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // Approve: update claim status, update listing owner and isClaimed
      await db.$transaction([
        db.claimRequest.update({
          where: { id },
          data: { status: 'APPROVED' }
        }),
        db.listing.update({
          where: { id: claim.listingId },
          data: {
            userId: claim.userId,
            isClaimed: true
          }
        })
      ])
      return NextResponse.json({ success: true, message: 'Claim approved' })
    } else if (action === 'reject') {
      // Reject: update claim status
      await db.claimRequest.update({
        where: { id },
        data: { status: 'REJECTED' }
      })
      return NextResponse.json({ success: true, message: 'Claim rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating claim request:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
