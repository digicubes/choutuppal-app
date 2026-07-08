import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  const news = await prisma.$queryRaw`SELECT title, "isPublished" FROM "News" WHERE title LIKE '%డిజిటల్ సేవల%'`;
  console.log('News SQL Output:', news);

  const blogs = await prisma.$queryRaw`SELECT title, "isPublished" FROM "Blog" WHERE title LIKE '%వ్యాపారులకు గైడ్%'`;
  console.log('Blog SQL Output:', blogs);
}

checkData().finally(() => prisma.$disconnect());
