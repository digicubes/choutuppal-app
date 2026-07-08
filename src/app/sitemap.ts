import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://choutuppal.in'

  // Fetch News
  const newsItems = await db.news.findMany({
    where: { isPublished: true },
    select: { id: true, slug: true, createdAt: true },
  })
  
  const newsUrls = newsItems.map((news) => ({
    url: `${baseUrl}/news/${news.slug || news.id}`,
    lastModified: news.createdAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Fetch Blogs
  const blogItems = await db.blog.findMany({
    where: { isPublished: true },
    select: { id: true, slug: true, updatedAt: true },
  })

  const blogUrls = blogItems.map((blog) => ({
    url: `${baseUrl}/blog/${blog.slug || blog.id}`,
    lastModified: blog.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Fetch Listings
  const listings = await db.listing.findMany({
    where: { isApproved: true },
    select: { id: true, slug: true, updatedAt: true },
  })

  const listingUrls = listings.map((listing) => ({
    url: `${baseUrl}/listing/${listing.slug || listing.id}`,
    lastModified: listing.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  // Fetch Real Estate
  const realEstateListings = await db.realEstateListing.findMany({
    where: { isApproved: true },
    select: { id: true, slug: true, updatedAt: true },
  })

  const realEstateUrls = realEstateListings.map((re) => ({
    url: `${baseUrl}/listing/${re.slug || re.id}`,
    lastModified: re.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    ...listingUrls,
    ...realEstateUrls,
    ...newsUrls,
    ...blogUrls,
  ]
}
