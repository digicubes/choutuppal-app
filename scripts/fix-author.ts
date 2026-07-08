import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting author name fix...')

  const blogResult = await prisma.blog.updateMany({
    data: {
      authorName: 'Choutuppal App Team'
    }
  })
  console.log(`Updated ${blogResult.count} blog posts.`)

  const newsResult = await prisma.news.updateMany({
    data: {
      authorName: 'Choutuppal App Team'
    }
  })
  console.log(`Updated ${newsResult.count} news articles.`)

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
