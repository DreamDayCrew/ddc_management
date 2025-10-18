-- Add payment column to fulfillment_plans table
ALTER TABLE fulfillment_plans
ADD COLUMN payment DECIMAL(10, 2);
