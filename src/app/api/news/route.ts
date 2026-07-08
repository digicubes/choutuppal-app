
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('cityId')

    const where: Record<string, unknown> = { isPublished: true }

    if (cityId) {
      where.cityId = cityId
    }

    const news = await db.news.findMany({
      where,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        source: true,
        createdAt: true,
        cityId: true,
        authorId: true,
        city: { select: { id: true, name: true, slug: true } }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(news, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30'
      }
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { supabase } = await import('@/lib/supabase');
    const token = req.headers.get('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !['admin', 'city_admin', 'super_admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    let { title, content, source, imageUrl, cityId, authorId, authorName, isPublished } = body;

    const city = await db.city.findFirst({ where: { id: cityId } });
    if (!city) {
      const defaultCity = await db.city.findFirst();
      if (defaultCity) {
        cityId = defaultCity.id;
      } else {
        return NextResponse.json({ error: 'No city found to associate with news' }, { status: 400 });
      }
    }

    let baseSlug = title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') || 'news-' + Date.now();
    let slug = baseSlug;
    let counter = 1;
    while (await db.news.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const news = await db.news.create({
      data: {
        title,
        slug,
        content,
        source,
        imageUrl,
        authorName: authorName || 'Choutuppal App Team',
        cityId,
        authorId: user.id,
        isPublished: isPublished ?? true
      }
    });

    // Create notifications for all users
    try {
      const allUsers = await db.user.findMany({ select: { id: true } });
      const notifications = allUsers.map(u => ({
        userId: u.id,
        actorId: user.id,
        type: 'NEWS',
        message: `కొత్త వార్త: ${title}`,
        link: `/news/${slug}`,
      }));
      await db.notification.createMany({ data: notifications });
    } catch (notifError) {
      console.error('Error creating notifications for news:', notifError);
    }

    return NextResponse.json(news, { status: 201 });
  } catch (error: any) {
    console.error('Prisma News Create Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
