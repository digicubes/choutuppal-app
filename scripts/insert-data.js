const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Inserting Spin Prizes...');
  
  // Clear existing prizes if any to avoid duplicates
  await prisma.spinPrize.deleteMany({});
  
  await prisma.spinPrize.createMany({
    data: [
      {
        label: 'Better Luck Next Time',
        prizeType: 'none',
        prizeValue: 0,
        probability: 0.50,
        color: '#9CA3AF', // Gray
        isActive: true
      },
      {
        label: '50 Coins Reward',
        prizeType: 'coins',
        prizeValue: 50,
        probability: 0.20,
        color: '#F59E0B', // Amber
        isActive: true
      },
      {
        label: '10% Off at Citizen CSC',
        prizeType: 'discount',
        prizeValue: 10,
        probability: 0.15,
        color: '#3B82F6', // Blue
        isActive: true
      },
      {
        label: 'Free Business Listing',
        prizeType: 'free_listing',
        prizeValue: 1,
        probability: 0.10,
        color: '#10B981', // Green
        isActive: true
      },
      {
        label: '₹100 Off on Real Estate',
        prizeType: 'discount',
        prizeValue: 100,
        probability: 0.04,
        color: '#8B5CF6', // Purple
        isActive: true
      },
      {
        label: 'Jackpot - 500 Coins!',
        prizeType: 'coins',
        prizeValue: 500,
        probability: 0.01,
        color: '#EF4444', // Red
        isActive: true
      }
    ]
  });
  console.log('Prizes inserted successfully.');

  console.log('Inserting Leader Profiles...');
  
  // Create dummy users for leaders
  const leader1 = await prisma.user.upsert({
    where: { phone: '919999999991' },
    update: {},
    create: {
      fullName: 'Sri. Komatireddy Venkat Reddy',
      phone: '919999999991',
      role: 'user',
    }
  });

  const leader2 = await prisma.user.upsert({
    where: { phone: '919999999992' },
    update: {},
    create: {
      fullName: 'Sri. Raju Goud',
      phone: '919999999992',
      role: 'user',
    }
  });

  // Create profiles
  await prisma.profile.upsert({
    where: { userId: leader1.id },
    update: {
      isPublicFigure: true,
      publicFigureCategory: 'POLITICIAN'
    },
    create: {
      userId: leader1.id,
      bio: 'Honourable Minister, Government of Telangana',
      isPublicFigure: true,
      publicFigureCategory: 'POLITICIAN',
      followersCount: 15420
    }
  });

  await prisma.profile.upsert({
    where: { userId: leader2.id },
    update: {
      isPublicFigure: true,
      publicFigureCategory: 'GOVT_OFFICIAL'
    },
    create: {
      userId: leader2.id,
      bio: 'Municipal Chairman, Choutuppal',
      isPublicFigure: true,
      publicFigureCategory: 'GOVT_OFFICIAL',
      followersCount: 8430
    }
  });

  console.log('Leader profiles inserted successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
