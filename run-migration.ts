import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🚀 Running migration to add expense_categories column...');
    
    // Check if the column already exists
    const checkResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'configurations' 
      AND column_name = 'expense_categories';
    `;

    if (checkResult.length === 0) {
      // Add the new column with a default value
      await sql`
        ALTER TABLE configurations 
        ADD COLUMN IF NOT EXISTS expense_categories text[] NOT NULL 
        DEFAULT ARRAY['Materials', 'Labor', 'Venue', 'Catering', 'Equipment', 'Transportation', 'Marketing', 'Miscellaneous']::text[];
      `;
      
      console.log('✅ Successfully added expense_categories column to configurations table');
    } else {
      console.log('ℹ️ expense_categories column already exists');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();
