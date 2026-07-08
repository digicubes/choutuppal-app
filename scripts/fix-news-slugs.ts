import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const news = await prisma.news.findMany()

  let count = 0
  for (const item of news) {
    if (!item.slug || item.slug === '---' || item.slug.startsWith('news-') || item.slug.includes(' ')) {
      let baseSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'news'
      let slug = baseSlug
      let counter = 1
      let exists = await prisma.news.findFirst({ where: { slug, id: { not: item.id } } })
      while (exists) {
        slug = `${baseSlug}-${counter}`
        exists = await prisma.news.findFirst({ where: { slug, id: { not: item.id } } })
        counter++
      }

      await prisma.news.update({
        where: { id: item.id },
        data: { slug }
      })
      console.log(`Updated news ${item.id} with slug ${slug}`)
      count++
    }
  }

  console.log(`Fixed ${count} news slugs.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
