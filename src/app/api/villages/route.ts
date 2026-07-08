import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const cityId = searchParams.get('cityId')

    const where: any = {}
    if (cityId) where.cityId = cityId

    const villages = await db.village.findMany({
      where,
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(villages)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
