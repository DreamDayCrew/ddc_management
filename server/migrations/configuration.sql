-- Add payment information columns to configurations table
ALTER TABLE configurations
  ADD COLUMN upi_id TEXT,
  ADD COLUMN upi_qr_code TEXT,
  ADD COLUMN account_holder_name TEXT,
  ADD COLUMN bank_name TEXT,
  ADD COLUMN account_number TEXT,
  ADD COLUMN ifsc_code TEXT,
  ADD COLUMN pan_number TEXT;

-- Add images column to requirements table (stores file paths/URLs)
ALTER TABLE requirements 
ADD COLUMN images TEXT[] DEFAULT '{}';