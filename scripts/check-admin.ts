import mongoose from 'mongoose';
import { UserModel } from '../src/models/user.model';
import { env } from '../src/config/env';

async function checkAdmins() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const admins = await UserModel.find({ role: 'admin' });
    console.log(`\n📊 Found ${admins.length} admin user(s):`);
    
    if (admins.length === 0) {
      console.log('\n⚠️  No admin users found!');
      console.log('💡 You need to create an admin user first.');
    } else {
      admins.forEach((admin: any) => {
        console.log(`  • ${admin.email}`);
        console.log(`    - Role: ${admin.role}`);
        console.log(`    - Verified: ${admin.isEmailVerified ? '✅' : '❌'}`);
        console.log(`    - Created: ${admin.createdAt}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdmins();
