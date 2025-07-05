
#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupSupabaseDatabase() {
  console.log('🚀 SafePlay™ Supabase Database Setup');
  console.log('=====================================\n');

  // Get Supabase URL from user
  const supabaseUrl = await new Promise((resolve) => {
    rl.question('Enter your Supabase database URL: ', (answer) => {
      resolve(answer.trim());
    });
  });

  if (!supabaseUrl || !supabaseUrl.includes('supabase')) {
    console.error('❌ Invalid Supabase URL provided');
    rl.close();
    return;
  }

  console.log('\n📝 Updating configuration files...');

  const fs = require('fs');
  const path = require('path');

  // Update .env file
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(
    /DATABASE_URL="[^"]*"/,
    `DATABASE_URL="${supabaseUrl}"`
  );
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env file');

  // Update vercel.json file
  const vercelPath = path.join(__dirname, '..', 'vercel.json');
  let vercelContent = fs.readFileSync(vercelPath, 'utf8');
  const vercelConfig = JSON.parse(vercelContent);
  
  vercelConfig.env.DATABASE_URL = supabaseUrl;
  vercelConfig.build.env.DATABASE_URL = supabaseUrl;
  
  fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));
  console.log('✅ Updated vercel.json file');

  console.log('\n🔧 Testing database connection...');

  try {
    // Test connection with new URL
    process.env.DATABASE_URL = supabaseUrl;
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    rl.close();
    return;
  }

  console.log('\n📊 Pushing database schema...');
  const { exec } = require('child_process');
  
  await new Promise((resolve, reject) => {
    exec('npx prisma db push', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Schema push failed:', error.message);
        reject(error);
      } else {
        console.log('✅ Database schema created successfully!');
        resolve();
      }
    });
  });

  console.log('\n🌱 Seeding database with demo data...');
  
  await new Promise((resolve, reject) => {
    exec('npx prisma db seed', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Database seeding failed:', error.message);
        reject(error);
      } else {
        console.log('✅ Database seeded successfully!');
        console.log('\n🔑 Demo Account Credentials:');
        console.log('Company Admin: admin@mysafeplay.ai / password123');
        console.log('Venue Admin: venue@mysafeplay.ai / password123');
        console.log('Parent: parent@mysafeplay.ai / password123');
        console.log('John Doe: john@mysafeplay.ai / johndoe123');
        resolve();
      }
    });
  });

  console.log('\n🎉 Supabase database setup complete!');
  console.log('You can now deploy to Vercel with confidence.');
  
  rl.close();
}

setupSupabaseDatabase().catch(console.error);
