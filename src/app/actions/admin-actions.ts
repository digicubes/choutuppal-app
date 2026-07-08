"use server";

import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function getAdminStats() {
  return {
    users: await db.user.count(),
    listings: await db.listing.count(),
    banners: await db.bannerAd.count(),
    realEstate: await db.realEstateListing.count()
  };
}

export async function getAdminListings() {
  const listings = await db.listing.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true, city: true } });
  const realEstate = await db.realEstateListing.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true, city: true } });
  return { listings, realEstate };
}

export async function deleteAdminListing(id: string, type: 'business' | 'real_estate') {
  if (type === 'real_estate') {
    return await db.realEstateListing.delete({ where: { id } });
  } else {
    return await db.listing.delete({ where: { id } });
  }
}

export async function getAdminBanners() {
  return await db.bannerAd.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function deleteAdminBanner(id: string) {
  return await db.bannerAd.delete({ where: { id } });
}

export async function getAdminStories() {
  return await db.story.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function deleteAdminStory(id: string) {
  return await db.story.delete({ where: { id } });
}

export async function getAdminNews() {
  return await db.news.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function deleteAdminNews(id: string) {
  return await db.news.delete({ where: { id } });
}

export async function createAdminListing(data: any, type: 'business' | 'real_estate') {
  if (type === 'real_estate') {
    return await db.realEstateListing.create({ data });
  } else {
    return await db.listing.create({ data });
  }
}

export async function updateAdminListing(id: string, data: any, type: 'business' | 'real_estate') {
  if (type === 'real_estate') {
    return await db.realEstateListing.update({ where: { id }, data });
  } else {
    return await db.listing.update({ where: { id }, data });
  }
}

export async function bulkCreateAdminListings(listings: any[], type: 'business' | 'real_estate') {
  if (type === 'real_estate') {
    return await db.realEstateListing.createMany({ data: listings, skipDuplicates: true });
  } else {
    return await db.listing.createMany({ data: listings, skipDuplicates: true });
  }
}

export async function createAdminBanner(data: any) {
  return await db.bannerAd.create({ data });
}

export async function createAdminStory(data: any) {
  return await db.story.create({ data });
}

export async function createAdminNews(data: any) {
  let baseSlug = data.title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') || 'news-' + Date.now();
  let slug = baseSlug;
  let counter = 1;
  while (await db.news.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return await db.news.create({ data: { ...data, slug } });
}

// ─── Users Management ──────────────────────────────────────────────────

export async function getAdminUsers() {
  return await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      subscriptionTier: true,
      isFeatured: true,
      createdAt: true,
      avatarUrl: true,
      _count: {
        select: {
          listings: true,
          posts: true,
          stories: true
        }
      }
    }
  });
}

export async function getAdminUserContent(userId: string) {
  const listings = await db.listing.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  const posts = await db.post.findMany({ where: { authorId: userId }, orderBy: { createdAt: 'desc' } });
  const stories = await db.story.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  return JSON.parse(JSON.stringify({ listings, posts, stories }));
}

export async function deleteAdminUserPost(id: string) {
  return await db.post.delete({ where: { id } });
}

export async function updateAdminUserRole(id: string, role: string) {
  return await db.user.update({
    where: { id },
    data: { role }
  });
}

export async function toggleAdminUserPremium(id: string, isPremium: boolean) {
  return await db.user.update({
    where: { id },
    data: { subscriptionTier: isPremium ? 'premium' : 'free' }
  });
}

export async function toggleAdminUserFeatured(id: string, isFeatured: boolean) {
  return await db.user.update({
    where: { id },
    data: { isFeatured }
  });
}

export async function resetAdminUserPassword(email: string) {
  const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(email);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function deleteAdminUser(id: string) {
  try {
    // First delete from Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      console.error('Failed to delete user from Supabase Auth:', error);
    }

    await db.user.delete({ where: { id } });
    return JSON.parse(JSON.stringify({ success: true }));
  } catch (err: any) {
    console.error('Failed to delete admin user:', err);
    throw new Error(err.message || 'Failed to delete user');
  }
}

// ─── News & Blogs & Ticker ──────────────────────────────────────────

export async function updateAdminNews(id: string, data: any) {
  return await db.news.update({ where: { id }, data });
}

export async function getAdminBlogs() {
  return await db.blog.findMany({ orderBy: { createdAt: 'desc' }, include: { author: { select: { fullName: true } } } });
}

export async function createAdminBlog(data: any) {
  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
  let finalCityId = data.cityId || null;
  if (finalCityId) {
    const city = await db.city.findUnique({ where: { id: finalCityId } });
    if (!city) {
      const firstCity = await db.city.findFirst();
      finalCityId = firstCity ? firstCity.id : null;
    }
  }
  return await db.blog.create({ data: { ...data, slug, cityId: finalCityId } });
}

export async function updateAdminBlog(id: string, data: any) {
  let finalCityId = data.cityId || null;
  if (finalCityId) {
    const city = await db.city.findUnique({ where: { id: finalCityId } });
    if (!city) {
      const firstCity = await db.city.findFirst();
      finalCityId = firstCity ? firstCity.id : null;
    }
  }
  return await db.blog.update({ where: { id }, data: { ...data, cityId: finalCityId } });
}

export async function deleteAdminBlog(id: string) {
  return await db.blog.delete({ where: { id } });
}

export async function getAnnouncementTicker() {
  const settings = await db.siteSetting.findFirst();
  return settings?.announcementTicker || '';
}

export async function updateAnnouncementTicker(ticker: string) {
  const settings = await db.siteSetting.findFirst();
  if (settings) {
    return await db.siteSetting.update({
      where: { id: settings.id },
      data: { announcementTicker: ticker }
    });
  } else {
    return await db.siteSetting.create({
      data: { announcementTicker: ticker }
    });
  }
}

export async function sendPushNotification(title: string, message: string, link?: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { error: 'Unauthorized: No active session' };
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user || !['admin', 'super_admin', 'city_admin'].includes(user.role)) {
      return { error: 'Forbidden: Not an admin' };
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    const privateKey = process.env.VAPID_PRIVATE_KEY || '';

    if (!publicKey || !privateKey) {
      return { error: 'VAPID Keys missing in Vercel Env' };
    }
    webpush.setVapidDetails('mailto:admin@choutuppal.in', publicKey, privateKey);

    const subscriptions = await db.pushSubscription.findMany();
    if (subscriptions.length === 0) {
      return { error: 'No users subscribed yet.' };
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url: link || '/',
    });

    let successful = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys as any }, payload);
        successful++;
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await db.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    }

    return { success: true, sentCount: successful };
  } catch (error: any) {
    console.error('Push Send Error:', error);
    return { error: error.message || 'Internal Server Error' };
  }
}

// ─── Categories & Villages Management ───────────────────────────────────

export async function getAdminCategories() {
  return await db.category.findMany({ orderBy: { name: 'asc' } });
}

export async function createAdminCategory(data: any) {
  let baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'category-' + Date.now();
  let slug = baseSlug;
  let counter = 1;
  while (await db.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return await db.category.create({ data: { ...data, slug } });
}

export async function updateAdminCategory(id: string, data: any) {
  return await db.category.update({ where: { id }, data });
}

export async function deleteAdminCategory(id: string) {
  return await db.category.delete({ where: { id } });
}

export async function getAdminVillages() {
  return await db.village.findMany({ orderBy: { name: 'asc' }, include: { city: true } });
}

export async function createAdminVillage(data: any) {
  let cityId = data.cityId;
  if (!cityId) {
    const firstCity = await db.city.findFirst();
    if (firstCity) cityId = firstCity.id;
  }
  return await db.village.create({ data: { ...data, cityId } });
}

export async function updateAdminVillage(id: string, data: any) {
  return await db.village.update({ where: { id }, data });
}

export async function deleteAdminVillage(id: string) {
  return await db.village.delete({ where: { id } });
}
