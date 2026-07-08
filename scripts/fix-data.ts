import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Get the City ID for Choutuppal
  const city = await prisma.city.findFirst({
    where: { name: 'Choutuppal' },
  });

  if (!city) {
    console.error('Choutuppal city not found!');
    return;
  }

  // 2. Fix Slugs and set isFeatured for listings
  const listings = await prisma.listing.findMany({
    where: { cityId: city.id },
    take: 5
  });

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const newSlug = listing.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + listing.id.substring(0, 4);
    
    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        slug: newSlug,
        isFeatured: i < 4, // First 4 will be featured
      }
    });
  }
  console.log(`Updated ${listings.length} listings with valid slugs and isFeatured status.`);

  const newsItems = [
    { title: 'చౌటుప్పల్ లో కొత్త వాటర్ ట్యాంక్ ప్రారంభోత్సవం', slug: 'water-tank-' + Date.now(), content: 'స్థానిక ప్రజల దాహార్తిని తీర్చడానికి కొత్త వాటర్ ట్యాంక్ ప్రారంభించబడింది.', isPublished: true, cityId: city.id },
    { title: 'హైదరాబాద్-విజయవాడ హైవే పై రోడ్డు మరమ్మతు పనులు', slug: 'highway-repairs-' + Date.now(), content: 'ప్రయాణికుల సౌకర్యార్థం హైవే పై రోడ్డు మరమ్మతు పనులు వేగవంతం చేయబడ్డాయి.', isPublished: true, cityId: city.id },
    { title: 'చౌటుప్పల్ పట్టణంలో బోనాలు పండుగ వైభవం', slug: 'bonalu-festival-' + Date.now(), content: 'చౌటుప్పల్ పట్టణంలో ప్రజలు బోనాలు పండుగను ఎంతో భక్తి శ్రద్ధలతో మరియు వైభవంగా జరుపుకున్నారు.', isPublished: true, cityId: city.id },
  ];

  for (const news of newsItems) {
    await prisma.news.create({ data: news });
  }
  console.log(`Added 3 News items.`);

  // 4. Get a Super Admin or City Admin for the Blog author
  const admin = await prisma.user.findFirst({
    where: { role: { in: ['super_admin', 'city_admin'] } }
  });

  if (!admin) {
    console.error('Admin user not found for blog author!');
  } else {
    // 5. Add 2 Blog Posts
    const blogs = [
      {
        title: 'చౌటుప్పల్ లో ఉన్న టాప్ 5 టిఫిన్ సెంటర్లు',
        slug: 'top-5-tiffin-centers-in-choutuppal-' + Date.now(),
        content: '<p>చౌటుప్పల్ లో రుచికరమైన టిఫిన్ ఎక్కడ దొరుకుతుందో తెలుసుకుందాం...</p><ul><li>Sri Venkateshwara Tiffins</li><li>Choutuppal Biryani House (Breakfast options)</li><li>Amma Mess</li></ul>',
        isPublished: true,
        cityId: city.id,
        authorId: admin.id
      },
      {
        title: 'మీ బిజినెస్ ని ఆన్లైన్ లో ఎలా పెంచాలి?',
        slug: 'how-to-grow-your-business-online-' + Date.now(),
        content: '<p>నేటి డిజిటల్ యుగంలో మీ వ్యాపారాన్ని ఆన్లైన్ లో పెంచుకోవడం చాలా ముఖ్యం. చౌటుప్పల్ యాప్ ద్వారా మీరు సులభంగా మీ కస్టమర్లను చేరుకోవచ్చు.</p>',
        isPublished: true,
        cityId: city.id,
        authorId: admin.id
      }
    ];

    for (const blog of blogs) {
      await prisma.blog.create({ data: blog });
    }
    console.log(`Added 2 Blog posts.`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
