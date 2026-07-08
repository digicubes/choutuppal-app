import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const settings = await db.siteSetting.findFirst()
    return NextResponse.json(settings || {})
  } catch (error) {
    console.error('Failed to get settings', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const settings = await db.siteSetting.findFirst()

    // Destructure to prevent updating readonly or mismatched fields
    const { 
      id, 
      createdAt, 
      updatedAt, 
      primaryLogoUrl, 
      supportPhone,
      officeAddress,
      ...rest 
    } = data
    
    const dbData = {
      ...rest,
      ...(primaryLogoUrl !== undefined ? { logoUrl: primaryLogoUrl } : {}),
      ...(supportPhone !== undefined && !rest.contactPhone ? { contactPhone: supportPhone } : {}),
      ...(officeAddress !== undefined && !rest.contactAddress ? { contactAddress: officeAddress } : {})
    }

    let updatedSettings
    if (settings) {
      updatedSettings = await db.siteSetting.update({
        where: { id: settings.id },
        data: dbData
      })
    } else {
      updatedSettings = await db.siteSetting.create({
        data: dbData
      })
    }

    revalidatePath('/', 'layout')
    
    return NextResponse.json(updatedSettings)
  } catch (error: any) {
    console.error('Failed to update settings', error)
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 })
  }
}
