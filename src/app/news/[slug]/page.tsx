export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Newspaper, Calendar, MapPin, Share2, ArrowLeft, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { OptimizedImage } from '@/components/optimized-image'
import Link from 'next/link'
import { ShareButtons } from './share-buttons'

async function getNews(slug: string) {
  try {
    return await db.news.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: { city: true },
    })
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const news = await getNews(slug)
  if (!news) return { title: 'News Not Found' }

  const title = `${news.title} in Choutuppal | Choutuppal App`
  const description = news.content?.replace(/<[^>]*>?/gm, '').substring(0, 160) || `Read ${news.title} on Choutuppal App`
  
  const rawImage = news.imageUrl || '/og-default.png'
  const absoluteImageUrl = rawImage.startsWith('/') 
    ? `https://choutuppal.in${rawImage}` 
    : rawImage

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: absoluteImageUrl, width: 1200, height: 630 }],
      type: 'article',
      url: `https://choutuppal.in/news/${news.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: absoluteImageUrl, width: 1200, height: 630 }],
    }
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const news = await getNews(slug)

  if (!news) {
    notFound()
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": news.title,
            "image": news.imageUrl ? [news.imageUrl] : [],
            "datePublished": news.createdAt.toISOString(),
            "dateModified": news.createdAt.toISOString(),
            "author": [{
              "@type": "Organization",
              "name": "Choutuppal App"
            }]
          })
        }}
      />
      <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href={`/city/${news.city.slug}?view=news`} className="p-2 hover:bg-gray-100 rounded-full transition-colors -ml-2">
            <ArrowLeft className="size-5 text-gray-700" />
          </Link>
          <h1 className="font-semibold text-gray-900 truncate flex-1">News Article</h1>
          <ShareButtons title={news.title} text={news.content?.substring(0, 100) || ''} />
        </div>
      </div>

      <main className="max-w-3xl mx-auto">
        <article className="bg-white shadow-sm md:mt-6 md:rounded-2xl overflow-hidden border border-gray-100">
          {/* Cover Image */}
          <div className="relative w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
            {news.imageUrl ? (
              <OptimizedImage
                src={news.imageUrl}
                alt={news.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#4169E1] to-[#D4AF37] flex items-center justify-center">
                <Newspaper className="w-16 h-16 text-white/30" />
              </div>
            )}
          </div>

          <div className="p-5 md:p-8 space-y-6">
            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <Badge variant="secondary" className="bg-[#4169E1]/10 text-[#4169E1] hover:bg-[#4169E1]/20">
                News
              </Badge>
              <div className="flex items-center gap-1">
                <Calendar className="size-4" />
                <time dateTime={news.createdAt.toISOString()}>
                  {new Date(news.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
              {news.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  {news.city.name}
                </div>
              )}
              {news.authorName && (
                <div className="flex items-center gap-1">
                  <User className="size-4" />
                  {news.authorName}
                </div>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {news.title}
            </h1>

            {/* Content */}
            <div className="prose prose-gray max-w-none prose-p:leading-relaxed prose-p:text-gray-600 prose-headings:text-gray-900">
              {news.content ? (
                <div dangerouslySetInnerHTML={{ __html: news.content }} />
              ) : (
                <p className="italic text-gray-400">No content available.</p>
              )}
            </div>

            {/* Share Section */}
            <div className="pt-8 mt-8 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Share2 className="size-4 text-[#4169E1]" />
                Share this article
              </h3>
              <ShareButtons title={news.title} text={news.content?.substring(0, 100) || ''} showLabels />
            </div>
          </div>
        </article>
      </main>
    </div>
    </>
  )
}
