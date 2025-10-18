import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🚀 Running migration to add vendor_category column...');
    
    // Check if the column already exists
    const checkResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fulfillment_plans' 
      AND column_name = 'vendor_category';
    `;

    if (checkResult.length === 0) {
      // Add the new column
      await sql`
        ALTER TABLE fulfillment_plans 
        ADD COLUMN IF NOT EXISTS vendor_category text;
      `;
      
      console.log('✅ Successfully added vendor_category column to fulfillment_plans table');
    } else {
      console.log('ℹ️ vendor_category column already exists');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();
