const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'mailmosin@gmail.com';
  
  // 1. Find user
  const user = await prisma.user.findFirst({
    where: { email: email }
  });

  if (!user) {
    console.log('User not found with email:', email);
    // Let's list top 3 users if not found
    const users = await prisma.user.findMany({ take: 3 });
    console.log('Top 3 users:', users.map(u => ({ id: u.id, email: u.email, phone: u.phone, role: u.role })));
    return;
  }

  // 2. Update role to super_admin
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'super_admin' }
  });

  console.log('Successfully updated user to super_admin:');
  console.log({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
