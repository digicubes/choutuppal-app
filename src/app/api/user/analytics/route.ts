import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const [listings, realEstate, banners] = await Promise.all([
      db.listing.findMany({ where: { userId } }),
      db.realEstateListing.findMany({ where: { userId } }),
      db.bannerAd.findMany({ where: { userId } }),
    ])

    const totalListingViews = listings.reduce((sum, l) => sum + (l.viewsCount || 0), 0)
    const totalRealEstateViews = 0 // RealEstateListing does not track viewsCount in schema
    
    const totalViews = totalListingViews + totalRealEstateViews
    const activeListings = listings.filter(l => l.status === 'APPROVED').length + 
                           realEstate.filter(r => r.status === 'APPROVED').length
                           
    const totalInteractions = listings.reduce((sum, l) => sum + ((l as any).leadsCount || 0), 0)

    // Format data for recharts
    const chartData = [
      { name: 'Business', views: totalListingViews, active: listings.filter(l => l.status === 'APPROVED').length },
      { name: 'Real Estate', views: totalRealEstateViews, active: realEstate.filter(r => r.status === 'APPROVED').length },
      { name: 'Banners', views: 0, active: banners.filter(b => b.status === 'APPROVED' && b.isActive).length },
    ]

    return NextResponse.json({
      totalViews,
      totalInteractions,
      activeListings,
      chartData
    })
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
