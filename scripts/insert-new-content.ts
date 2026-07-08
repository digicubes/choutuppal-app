import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function insertContent() {
  const city = await prisma.city.findFirst({ where: { name: { contains: 'Choutuppal', mode: 'insensitive' } } });
  if (!city) {
    console.error('City Choutuppal not found');
    return;
  }
  
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No users found');
    return;
  }

  // Insert News
  const news = await prisma.news.create({
    data: {
      title: 'చౌటుప్పల్: కొత్త డిజిటల్ సేవల కేంద్రం ప్రారంభం',
      slug: 'choutuppal-new-digital-center-' + Date.now(),
      content: 'సిటిజన్ సీఎస్సీ ఆధ్వర్యంలో చౌటుప్పల్ లో కొత్త డిజిటల్ సేవల కేంద్రం ప్రారంభమైంది. ఆధార్, పాస్పోర్ట్, మరియు ఇతర ప్రభుత్వ సేవలు ఇప్పుడు ఆన్లైన్ లో అందుబాటులో ఉన్నాయి.',
      isPublished: true,
      cityId: city.id
    }
  });
  console.log('Inserted News:', news.title);

  // Insert Blog
  const blog = await prisma.blog.create({
    data: {
      title: 'ఆన్లైన్ లో మీ వ్యాపారం ఎలా పెంచాలి? - చౌటుప్పల్ వ్యాపారులకు గైడ్',
      slug: 'how-to-grow-business-online-choutuppal-' + Date.now(),
      content: 'చౌటుప్పల్ లో వ్యాపారం చేసేవారు తమ బిజినెస్ ని ఆన్లైన్ కి తీసుకెళ్లడానికి కొన్ని సింపుల్ టిప్స్... చౌటుప్పల్ యాప్ ద్వారా మీ షాప్ ని లిస్ట్ చేయడం వల్ల కలిగే ప్రయోజనాలు ఇక్కడ ఉన్నాయి.',
      isPublished: true,
      cityId: city.id,
      authorId: user.id
    }
  });
  console.log('Inserted Blog:', blog.title);
}

insertContent().catch(console.error).finally(() => prisma.$disconnect());
