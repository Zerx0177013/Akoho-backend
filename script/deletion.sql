-- Drop foreign key constraints
ALTER TABLE situation DROP CONSTRAINT FK_Situation_Lot;
ALTER TABLE lot DROP CONSTRAINT FK_Lot_Race;
ALTER TABLE grossissement DROP CONSTRAINT FK_Grossissement_Race;

-- Now you can drop tables in any order
DROP TABLE race;
DROP TABLE lot;
DROP TABLE situation;
DROP TABLE grossissement;