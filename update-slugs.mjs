import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const news = await prisma.news.findMany({
    where: {
      OR: [
        { slug: null },
        { slug: '' }
      ]
    }
  })

  console.log(`Found ${news.length} news items without slug.`)

  for (const item of news) {
    let baseSlug = item.title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')
    let slug = baseSlug || 'news-' + Date.now()
    
    // check uniqueness
    let exists = await prisma.news.findUnique({ where: { slug } })
    let counter = 1
    while (exists) {
      slug = `${baseSlug}-${counter}`
      exists = await prisma.news.findUnique({ where: { slug } })
      counter++
    }

    await prisma.news.update({
      where: { id: item.id },
      data: { slug }
    })
    console.log(`Updated news ${item.id} with slug ${slug}`)
  }

  // Also fix any blogs without slug if they exist (though schema says it's required, some might have empty strings)
  const blogs = await prisma.blog.findMany({
    where: { slug: '' }
  })
  
  for (const item of blogs) {
    let baseSlug = item.title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')
    let slug = baseSlug || 'blog-' + Date.now()
    let counter = 1
    let exists = await prisma.blog.findUnique({ where: { slug } })
    while (exists && exists.id !== item.id) {
      slug = `${baseSlug}-${counter}`
      exists = await prisma.blog.findUnique({ where: { slug } })
      counter++
    }
    await prisma.blog.update({
      where: { id: item.id },
      data: { slug }
    })
    console.log(`Updated blog ${item.id} with slug ${slug}`)
  }

  console.log('Slugs updated successfully.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
