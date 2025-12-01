Alter table requirements
add column req_discount TEXT DEFAULT'false',
add column req_discount_amount NUMERIC(10, 2) DEFAULT 0;

Alter table expenses
drop column discount ,
drop column discount_amount;

Alter table events
add column discount TEXT DEFAULT'false',
add column discount_amount NUMERIC(10, 2) DEFAULT 0;
