const { execSync } = require('child_process');

try {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    console.log('🔄 Syncing Prisma schema with PostgreSQL database on deployment...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✅ PostgreSQL schema synchronized successfully.');
  } else {
    console.log('ℹ️ Local or non-postgres DATABASE_URL detected. Skipping db push during build.');
  }
} catch (err) {
  console.warn('⚠️ db push encountered an issue, proceeding with build:', err.message);
}
