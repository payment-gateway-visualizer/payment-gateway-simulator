ALTER TABLE users ADD COLUMN first_name VARCHAR(75) NOT NULL;
ALTER TABLE users ADD COLUMN last_name  VARCHAR(75) NOT NULL;
ALTER TABLE users DROP COLUMN full_name;



-- this file is used to change the full name into first name and last name in the users table. It adds two new columns, first_name and last_name, and removes the existing full_name column.