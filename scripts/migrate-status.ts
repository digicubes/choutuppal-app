import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration...')

  // 1. Listings
  const listingsRes = await prisma.listing.updateMany({
    where: { isApproved: true },
    data: { status: 'APPROVED' }
  })
  console.log(`Updated ${listingsRes.count} listings to APPROVED`)

  // 2. RealEstateListings
  const reListingsRes = await prisma.realEstateListing.updateMany({
    where: { isApproved: true },
    data: { status: 'APPROVED' }
  })
  console.log(`Updated ${reListingsRes.count} real estate listings to APPROVED`)

  // 3. BannerAds
  const bannersRes = await prisma.bannerAd.updateMany({
    where: { isActive: true },
    data: { status: 'APPROVED' }
  })
  console.log(`Updated ${bannersRes.count} banner ads to APPROVED`)

  console.log('Migration completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
