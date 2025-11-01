#!/usr/bin/env node
// Migration Script: PostgreSQL Users → MongoDB
// Run this BEFORE removing PostgreSQL dependencies

import prisma from '../prismaClient.js';
import { UserMigrationService } from '../services/userMigrationService.js';
import { connectMongoDB } from '../config/database.js';

async function migrateAllUsers() {
  console.log('🚀 Starting PostgreSQL → MongoDB User Migration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Connect to MongoDB first
    console.log('🔗 Connecting to MongoDB...');
    await connectMongoDB();
    console.log('✅ MongoDB connected');

    // Get migration stats before
    const statsBefore = await UserMigrationService.getSyncStats();
    console.log('📊 Migration stats BEFORE:');
    console.table(statsBefore);

    // Get all PostgreSQL users
    console.log('🔍 Fetching all PostgreSQL users...');
    const postgresUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📦 Found ${postgresUsers.length} PostgreSQL users to migrate`);

    if (postgresUsers.length === 0) {
      console.log('⚠️  No users found in PostgreSQL. Migration complete.');
      return;
    }

    // Batch migrate users
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < postgresUsers.length; i += batchSize) {
      const batch = postgresUsers.slice(i, i + batchSize);
      console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(postgresUsers.length/batchSize)} (${batch.length} users)`);

      for (const user of batch) {
        try {
          console.log(`  📝 Migrating: ${user.email} (${user.id})`);
          await UserMigrationService.syncUserToMongoDB(user.id);
          successCount++;
          console.log(`  ✅ Success: ${user.email}`);
        } catch (error) {
          errorCount++;
          errors.push({ user: user.email, error: error.message });
          console.error(`  ❌ Failed: ${user.email} - ${error.message}`);
        }
      }

      // Small delay between batches
      if (i + batchSize < postgresUsers.length) {
        console.log('   ⏱️  Waiting 1 second before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Get migration stats after
    const statsAfter = await UserMigrationService.getSyncStats();
    
    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration stats AFTER:');
    console.table(statsAfter);
    
    console.log('\n📈 Migration Results:');
    console.log(`✅ Successful migrations: ${successCount}`);
    console.log(`❌ Failed migrations: ${errorCount}`);
    console.log(`📊 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);

    if (errors.length > 0) {
      console.log('\n❌ Migration Errors:');
      console.table(errors);
    }

    console.log('\n🚀 Next Steps:');
    console.log('1. Verify MongoDB users in database');
    console.log('2. Test auth endpoints with MongoDB');
    console.log('3. Remove PostgreSQL dependencies');
    console.log('4. Deploy to production');

  } catch (error) {
    console.error('💥 CRITICAL MIGRATION ERROR:', error);
    throw error;
  }
}

// Command line options
const args = process.argv.slice(2);
const isForce = args.includes('--force');
const isDryRun = args.includes('--dry-run');

if (isDryRun) {
  console.log('🧪 DRY RUN MODE - No actual migration will be performed');
  // Add dry run logic here if needed
  process.exit(0);
}

if (!isForce) {
  console.log('⚠️  This will migrate ALL PostgreSQL users to MongoDB');
  console.log('⚠️  Make sure MongoDB is running and accessible');
  console.log('⚠️  Use --force flag to proceed or --dry-run to test');
  console.log('\nUsage: node migrateUsersToMongoDB.js --force');
  process.exit(1);
}

// Run migration
migrateAllUsers()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });