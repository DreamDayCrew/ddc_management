-- Create table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Event',
    from_account TEXT NOT NULL DEFAULT 'DDC Fund',
    to_account TEXT NOT NULL DEFAULT 'DDC Fund',
    description TEXT DEFAULT NULL,
    amount NUMERIC(10,2) NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    contributor TEXT[] DEFAULT '{}',
    contribution NUMERIC[] DEFAULT '{}',
    contribution_status TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    split_type TEXT
);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call function before each update
CREATE TRIGGER trigger_update_expenses_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE VIEW expenses_with_balance AS
SELECT
    e.*,
    SUM(
        CASE
            -- Money added to DDC Fund
            WHEN e.to_account = 'DDC Fund' THEN e.amount

            -- Money leaving DDC Fund
            WHEN e.from_account = 'DDC Fund' AND e.to_account <> 'DDC Fund' THEN -e.amount

            ELSE 0
        END
    ) OVER (
        ORDER BY e.date, e.created_at, e.id
    ) AS closing_balance
FROM expenses e;
