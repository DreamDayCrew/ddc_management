
-- Add review columns to fulfillment_plans table
ALTER TABLE fulfillment_plans 
ADD COLUMN customer_rating INTEGER,
ADD COLUMN team_rating INTEGER,
ADD COLUMN review_notes TEXT;

-- Optional: Add check constraints to ensure ratings are between 1 and 5
ALTER TABLE fulfillment_plans 
ADD CONSTRAINT customer_rating_range CHECK (customer_rating IS NULL OR (customer_rating >= 1 AND customer_rating <= 5)),
ADD CONSTRAINT team_rating_range CHECK (team_rating IS NULL OR (team_rating >= 1 AND team_rating <= 5));