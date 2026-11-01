const mongoose = require('mongoose');

const connectDB = async () => {
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library_management_system';
  
  // Prevent Node 18/20/24 IPv6 resolution conflict where 'localhost' resolves to '::1'
  if (uri.includes('://localhost')) {
    uri = uri.replace('://localhost', '://127.0.0.1');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`💡 Tip: Ensure MongoDB service is running.`);
    console.error(`   In PowerShell / Command Prompt, run: net start MongoDB`);
    console.error(`   Or verify the service in Windows Services (services.msc -> MongoDB Server).`);
    process.exit(1);
  }
};

module.exports = connectDB;
