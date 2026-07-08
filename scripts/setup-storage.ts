import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const prisma = new PrismaClient();

async function main() {
  // 1. Ensure the bucket exists
  const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
  if (bucketsError) {
    console.error('Error fetching buckets:', bucketsError);
    return;
  }

  const bucketExists = buckets.some((b) => b.name === 'listing-images');
  if (!bucketExists) {
    const { error: createError } = await supabaseAdmin.storage.createBucket('listing-images', { public: true });
    if (createError) {
      console.error('Error creating bucket:', createError);
    } else {
      console.log('Bucket "listing-images" created successfully.');
    }
  } else {
    console.log('Bucket "listing-images" already exists.');
  }

  // 2. Set proper RLS policies
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');
    `);
    console.log('Policy "Allow authenticated uploads" created.');
  } catch (err: any) {
    console.log('Upload policy might already exist or failed:', err.message);
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
    `);
    console.log('Policy "Allow public reads" created.');
  } catch (err: any) {
    console.log('Read policy might already exist or failed:', err.message);
  }

  console.log('Setup complete.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
