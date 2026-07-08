import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const active = searchParams.get('active')
    const parentId = searchParams.get('parentId')

    const where: any = {}
    if (active === 'true') where.isActive = true
    if (parentId !== null) where.parentId = parentId === 'null' ? null : parentId

    const categories = await db.category.findMany({
      where,
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
