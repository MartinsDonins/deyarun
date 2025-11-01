import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  console.log('🧑‍💻 Creating user: martins.donins@gmail.com...');

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'martins.donins@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️  User already exists with email: martins.donins@gmail.com');
      return existingUser;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('martinslai', 12);

    // Calculate age from birthDate
    const birthDate = new Date('1990-01-01');
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: 'Martins',
        lastName: 'Donins',
        email: 'martins.donins@gmail.com',
        password: hashedPassword,
        birthDate: birthDate,
        age: age,
        gender: 'male',
        fitnessLevel: 'beginner',
        weeklyGoal: 20,
        runningExperience: 'beginner',
        preferredDistance: '5k',
        timezone: 'Europe/Riga',
        units: 'metric',
        theme: 'dark',
        notificationsEnabled: true,
        locationSharingEnabled: false,
        isEmailVerified: true, // Set to true for easier access
        isProfileComplete: true
      }
    });

    console.log('✅ User created successfully!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.firstName, user.lastName);
    console.log('🆔 ID:', user.id);
    
    return user;

  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
}

// Run the script if this file is executed directly
console.log('🚀 Starting user creation script...');
console.log('Current directory:', process.cwd());
console.log('Script path:', import.meta.url);

createUser()
  .then((user) => {
    console.log('✅ User creation completed');
    console.log('🔑 You can now login with:');
    console.log('   Email: martins.donins@gmail.com');
    console.log('   Password: martinslai');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ User creation failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { createUser };
export default createUser;