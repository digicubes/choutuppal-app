import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  const listings = await prisma.listing.findMany({ select: { name: true, isApproved: true, isFeatured: true } });
  console.log('Listings:', listings.length, 'Approved:', listings.filter(l => l.isApproved).length);
  
  const news = await prisma.news.findMany({ select: { title: true, isPublished: true } });
  console.log('News:', news.length, 'Published:', news.filter(n => n.isPublished).length);
  
  const blogs = await prisma.blog.findMany({ select: { title: true, isPublished: true } });
  console.log('Blogs:', blogs.length, 'Published:', blogs.filter(b => b.isPublished).length);

  // Update site settings
  let settings = await prisma.siteSetting.findFirst();
  if (settings) {
    await prisma.siteSetting.update({
      where: { id: settings.id },
      data: {
        whatsappSupportNumber: '918790083706',
        heroWhatsappText: 'నమస్కారం, చౌటుప్పల్ యాప్ గురించి సమాచారం కావాలి',
        franchiseWhatsappText: 'నా నగరానికి ఫ్రాంచైజీ కోసం అప్లై చేయాలనుకుంటున్నాను',
        agentWhatsappText: 'చౌటుప్పల్ యాప్ లో ఏజెంట్ గా చేరాలనుకుంటున్నాను',
        instagramUrl: 'https://instagram.com/citizencsc',
        facebookUrl: 'https://facebook.com/citizencsc',
        youtubeUrl: 'https://youtube.com/@citizencsc',
      }
    });
    console.log('Updated SiteSettings correctly');
  } else {
    console.log('No SiteSettings found!');
  }
}

checkData().finally(() => prisma.$disconnect());
