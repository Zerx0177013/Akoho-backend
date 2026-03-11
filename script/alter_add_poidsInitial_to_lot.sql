-- Active: 1764962696862@@127.0.0.1@1433@akoho
-- SQL Server migration
IF COL_LENGTH('lot', 'poidsInitial') IS NULL
BEGIN
    ALTER TABLE lot
    ADD poidsInitial DECIMAL(10, 2) NOT NULL CONSTRAINT DF_lot_poidsInitial DEFAULT 0;
END
GO

-- MySQL equivalent (run separately on MySQL)
-- ALTER TABLE lot
-- ADD COLUMN poidsInitial DECIMAL(10,2) NOT NULL DEFAULT 0;
