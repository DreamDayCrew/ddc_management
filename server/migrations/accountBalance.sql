CREATE TABLE account_balance (
    id SERIAL PRIMARY KEY,
    name TEXT DEFAULT 'DDC Fund',
    balance NUMERIC(12,2) NOT NULL DEFAULT 0
);
insert into account_balance(balance) VALUEs (0);

CREATE TABLE repayments (
    id SERIAL PRIMARY KEY,
    source_name TEXT NOT NULL,
    allocated_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    repaid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    pending_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call function before each update
CREATE TRIGGER trigger_update_expenses_updated_at
BEFORE UPDATE ON repayments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
