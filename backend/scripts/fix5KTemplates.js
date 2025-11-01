// Script to fix 5K templates with proper user ID
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { connectMongoDB } from '../config/database.js';
import { TrainingProgramTemplate, User } from '../models/mongodb/index.js';

async function fix5KTemplates() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectMongoDB();
    
    // Find the super admin user
    const adminUser = await User.findOne({ email: 'martins.donins@gmail.com' });
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }
    
    console.log(`✅ Found admin user: ${adminUser.firstName} ${adminUser.lastName} (${adminUser._id})`);
    
    // Update all 5K templates to use admin user ID
    const result = await TrainingProgramTemplate.updateMany(
      { 
        targetDistance: '5K',
        createdBy: 'system'
      },
      { 
        $set: { 
          createdBy: adminUser._id.toString(),
          lastUpdatedBy: adminUser._id.toString()
        } 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} templates with proper user ID`);
    
    // Verify the fix
    const templates = await TrainingProgramTemplate.find({ targetDistance: '5K' });
    console.log('\n📊 5K Templates status:');
    templates.forEach(t => {
      console.log(`  - ${t.name}: createdBy = ${t.createdBy}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing templates:', error);
  } finally {
    process.exit(0);
  }
}

fix5KTemplates();