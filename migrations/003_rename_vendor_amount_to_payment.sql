-- Rename vendor_amount column to payment
ALTER TABLE fulfillment_plans RENAME COLUMN vendor_amount TO payment;
