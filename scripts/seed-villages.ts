import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Fetch default city ID (Choutuppal)
  const city = await prisma.city.findFirst({
    where: { slug: 'choutuppal' } // Assuming slug is choutuppal
  })

  if (!city) {
    console.error('City with slug "choutuppal" not found! Fallback to first city.')
    const firstCity = await prisma.city.findFirst()
    if (!firstCity) {
      console.error('No city found at all.')
      process.exit(1)
    }
    await seedVillages(firstCity.id)
  } else {
    await seedVillages(city.id)
  }
}

async function seedVillages(cityId: string) {
  const villages = [
    'Lakkarm',
    'Kottyalagudem',
    'Lingareddy Gudem',
    'Thangadpally',
    'Choutuppal'
  ]

  for (const name of villages) {
    const existing = await prisma.village.findFirst({
      where: { name, cityId }
    })
    
    if (!existing) {
      await prisma.village.create({
        data: {
          name,
          pincode: '508252',
          cityId
        }
      })
      console.log(`Created village: ${name}`)
    } else {
      console.log(`Village already exists: ${name}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
