-- Add vendor_category column to fulfillment_plans table
ALTER TABLE fulfillment_plans
ADD COLUMN vendor_category TEXT;
