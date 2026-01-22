-- Migration to add rentalId column to expenses table
-- This allows expenses to be linked to rental service orders

ALTER TABLE expenses 
ADD COLUMN rental_id VARCHAR;

-- Update the expenses_with_balance view to include the new rentalId column
DROP VIEW IF EXISTS expenses_with_balance;

CREATE VIEW expenses_with_balance AS
SELECT 
  e.*,
  (SELECT SUM(
    CASE 
      WHEN e2.type = 'Credit' THEN e2.amount 
      ELSE -e2.amount 
    END
  ) 
  FROM expenses e2 
  WHERE e2.created_at <= e.created_at
  ) AS closing_balance
FROM expenses e
ORDER BY e.created_at;