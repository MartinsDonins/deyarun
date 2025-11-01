// Script to create or update super admin user
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'martins.donins@gmail.com';
    const password = process.env.ADMIN_PASSWORD;
    
    // Validate required environment variables
    if (!password) {
      console.error('❌ Missing required environment variable: ADMIN_PASSWORD');
      console.log('Please set ADMIN_PASSWORD in your .env file');
      return;
    }
    
    console.log('Creating/updating super admin user...');
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    if (user) {
      // Update existing user to super admin
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'super_admin',
          subscriptionType: 'pro',
          isEmailVerified: true,
          permissions: ['all'],
          password: hashedPassword, // Update password too
          updatedAt: new Date()
        }
      });
      console.log('✅ Super admin user updated successfully');
    } else {
      // Create new super admin user
      user = await prisma.user.create({
        data: {
          firstName: 'Martins',
          lastName: 'Donins',
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'super_admin',
          subscriptionType: 'pro',
          birthDate: new Date('1990-01-01'),
          gender: 'male',
          isEmailVerified: true,
          isProfileComplete: true,
          permissions: ['all']
        }
      });
      console.log('✅ Super admin user created successfully');
    }
    
    console.log('📧 Email:', user.email);
    console.log('🔑 Password: [HIDDEN FOR SECURITY]');
    console.log('👑 Role:', user.role);
    console.log('💎 Subscription:', user.subscriptionType);
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createRegularUser() {
  try {
    const email = 'martins@donins.lv';
    const password = 'User123!';
    
    console.log('\nCreating regular user...');
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      console.log('⚠️  User already exists:', email);
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: {
        firstName: 'Martins',
        lastName: 'Donins',
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'user',
        subscriptionType: 'free',
        birthDate: new Date('1990-01-01'),
        gender: 'male',
        isEmailVerified: true,
        isProfileComplete: false
      }
    });
    
    console.log('✅ Regular user created successfully');
    console.log('📧 Email:', user.email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', user.role);
    console.log('💰 Subscription:', user.subscriptionType);
    
  } catch (error) {
    console.error('❌ Error creating regular user:', error);
  }
}

// Run both functions
async function main() {
  await createSuperAdmin();
  await createRegularUser();
}

main();