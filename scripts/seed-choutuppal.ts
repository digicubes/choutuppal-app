import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fetching or creating Choutuppal city...')
  
  // Create or find city
  let city = await prisma.city.findUnique({
    where: { slug: 'choutuppal' }
  })
  
  if (!city) {
    console.log('City not found, creating it...')
    city = await prisma.city.create({
      data: {
        name: 'Choutuppal',
        slug: 'choutuppal',
        subdomain: 'choutuppal',
        state: 'Telangana',
        brandName: 'Choutuppal App',
        primaryColor: '#4169E1',
        secondaryColor: '#D4AF37',
        latitude: 17.2985,
        longitude: 78.9256,
      }
    })
  }

  console.log('Fetching super admin user...')
  let user = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })
  if (!user) {
    user = await prisma.user.findFirst()
    if (!user) throw new Error("No users found to act as listing owner.")
  }

  const userId = user.id
  const cityId = city.id

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)

  // 1. Restaurants
  const restaurants = [
    {
      name: 'Sri Venkateshwara Tiffins',
      category: 'Restaurants',
      description: 'Authentic South Indian tiffins including Idli, Dosa, Vada, and Puri. Served fresh every morning.',
      address: 'Main Road, Near Bus Stand, Choutuppal',
      whatsappNumber: '919000000001',
      operatingHours: '6:00 AM - 11:30 PM',
      isApproved: true
    },
    {
      name: 'Choutuppal Biryani House',
      category: 'Restaurants',
      description: 'The best Hyderabadi Dum Biryani in town! We also serve delicious chicken and mutton curries.',
      address: 'Hyderabad - Vijayawada Highway, Choutuppal',
      whatsappNumber: '919000000002',
      operatingHours: '11:00 AM - 11:00 PM',
      isApproved: true
    },
    {
      name: 'Amma Mess',
      category: 'Restaurants',
      description: 'Homely meals and thalis at affordable prices. Pure vegetarian options available.',
      address: 'Gandhi Chowk, Choutuppal',
      whatsappNumber: '919000000003',
      operatingHours: '12:00 PM - 3:30 PM, 7:00 PM - 10:30 PM',
      isApproved: true
    }
  ]

  // 2. Hospitals & Clinics
  const hospitals = [
    {
      name: 'CHC Choutuppal (Government Hospital)',
      category: 'Hospitals',
      description: 'Community Health Centre offering 24/7 emergency services, OPD, and maternal care.',
      address: 'Hospital Road, Choutuppal',
      whatsappNumber: '919000000004',
      operatingHours: 'Open 24 Hours',
      isApproved: true
    },
    {
      name: 'Sai Ram Clinic',
      category: 'Hospitals',
      description: 'General physician clinic for everyday health issues, fever, cold, and minor injuries.',
      address: 'Bazar Street, Choutuppal',
      whatsappNumber: '919000000005',
      operatingHours: '9:00 AM - 1:00 PM, 5:00 PM - 9:00 PM',
      isApproved: true
    }
  ]

  // 3. Education & Schools
  const schools = [
    {
      name: 'Zilla Parishad High School',
      category: 'Education',
      description: 'Government High School for boys and girls from 6th to 10th standard.',
      address: 'School Road, Choutuppal',
      whatsappNumber: '919000000006',
      operatingHours: '9:00 AM - 4:00 PM',
      isApproved: true
    },
    {
      name: 'Viswabharathi EM School',
      category: 'Education',
      description: 'English medium school focusing on holistic education and extra-curricular activities.',
      address: 'Vidyaranya Colony, Choutuppal',
      whatsappNumber: '919000000007',
      operatingHours: '8:30 AM - 4:30 PM',
      isApproved: true
    }
  ]

  // 4. Professional Services
  const services = [
    {
      name: 'Choutuppal Xerox & Internet Center',
      category: 'Services',
      description: 'Color printouts, DTP, spiral binding, and all types of internet services available.',
      address: 'Opposite Bus Stand, Choutuppal',
      whatsappNumber: '919000000008',
      operatingHours: '8:00 AM - 9:00 PM',
      isApproved: true
    },
    {
      name: 'Local CA Services',
      category: 'Services',
      description: 'Expert accounting, GST filing, Income Tax returns, and business registration services.',
      address: 'Main Bazar, Choutuppal',
      whatsappNumber: '919000000009',
      operatingHours: '10:00 AM - 7:00 PM',
      isApproved: true
    }
  ]

  // 6. Shopping & Stores
  const stores = [
    {
      name: 'Choutuppal Super Market',
      category: 'Shopping',
      description: 'All groceries, household items, and daily essentials available under one roof at wholesale prices.',
      address: 'Main Road, Choutuppal',
      whatsappNumber: '919000000010',
      operatingHours: '7:00 AM - 10:00 PM',
      isApproved: true
    },
    {
      name: 'Lakshmi Kirana Store',
      category: 'Shopping',
      description: 'Fresh vegetables, milk, eggs, and all kirana items available.',
      address: 'Housing Board Colony, Choutuppal',
      whatsappNumber: '919000000011',
      operatingHours: '6:00 AM - 9:00 PM',
      isApproved: true
    }
  ]

  const allListings = [...restaurants, ...hospitals, ...schools, ...services, ...stores]

  for (const listing of allListings) {
    const slug = generateSlug(listing.name)
    await prisma.listing.create({
      data: {
        ...listing,
        userId,
        cityId,
        slug
      }
    })
    console.log(`Created listing: ${listing.name}`)
  }

  // 5. Real Estate
  console.log('Creating Real Estate listing...')
  await prisma.realEstateListing.create({
    data: {
      userId,
      cityId,
      title: '2 BHK Flat for Rent near Bus Stand',
      price: '8,500',
      ownerPhone: '919000000012',
      address: 'Near Bus Stand, Choutuppal',
      bedroomCount: 2,
      area: '1000 sq.ft',
      isApproved: true
    }
  })
  console.log('Created Real Estate listing.')

  console.log('Seed completed successfully.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
