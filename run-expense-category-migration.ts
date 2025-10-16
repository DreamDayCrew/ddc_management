import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🚀 Running migration to add category column to expenses table...');
    
    // Check if the column already exists
    const checkResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'expenses' 
      AND column_name = 'category';
    `;

    if (checkResult.length === 0) {
      // Add the new column
      await sql`
        ALTER TABLE expenses 
        ADD COLUMN IF NOT EXISTS category text;
      `;
      
      console.log('✅ Successfully added category column to expenses table');
    } else {
      console.log('ℹ️ category column already exists in expenses table');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();
