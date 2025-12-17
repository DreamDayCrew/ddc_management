-- Add expenseId to events table for payment expense tracking
ALTER TABLE events ADD COLUMN IF NOT EXISTS expense_id VARCHAR;

-- Add expenseId to fulfillment_plans table for payment expense tracking (without FK constraint due to type mismatch)
ALTER TABLE fulfillment_plans ADD COLUMN IF NOT EXISTS expense_id TEXT;
