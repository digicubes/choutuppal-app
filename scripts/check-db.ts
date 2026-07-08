import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking database for records...')

  const models = [
    { name: 'Listing', model: prisma.listing },
    { name: 'RealEstateListing', model: prisma.realEstateListing },
    { name: 'News', model: prisma.news },
    { name: 'Story', model: prisma.story },
    { name: 'BannerAd', model: prisma.bannerAd },
    { name: 'Blog', model: prisma.blog },
  ]

  for (const { name, model } of models) {
    const count = await (model as any).count()
    if (count > 0) {
      console.log(`Found ${count} records in ${name}. Deleting...`)
      await (model as any).deleteMany({})
      console.log(`Deleted all records from ${name}.`)
    } else {
      console.log(`${name} is already empty.`)
    }
  }

  console.log('Database check complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
