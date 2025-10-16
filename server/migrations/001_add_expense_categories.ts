import { neon } from '@neondatabase/serverless';

async function runMigration() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
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
      
      console.log('✅ Added expense_categories column to configurations table');
    } else {
      console.log('ℹ️ expense_categories column already exists');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
