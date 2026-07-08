import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const banners = await prisma.bannerAd.updateMany({
    data: {
      status: 'APPROVED',
      isActive: true,
    },
  });
  console.log(`Updated ${banners.count} banners to APPROVED and Active.`);

  const listings = await prisma.listing.updateMany({
    data: {
      status: 'APPROVED',
    },
  });
  console.log(`Updated ${listings.count} listings to APPROVED.`);

  const realEstate = await prisma.realEstateListing.updateMany({
    data: {
      status: 'APPROVED',
    },
  });
  console.log(`Updated ${realEstate.count} real estate listings to APPROVED.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
