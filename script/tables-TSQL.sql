CREATE DATABASE akoho;
GO

USE akoho;
GO

CREATE TABLE race (
    idRace INT IDENTITY (1, 1) PRIMARY KEY, -- auto-increment in SQL Server
    name NVARCHAR (255) NOT NULL,
    prixAchatSakafo DECIMAL(10, 2) NOT NULL,
    prixVenteAkoho DECIMAL(10, 2) NOT NULL,
    prixVenteAtody DECIMAL(10, 2) NOT NULL
);

CREATE TABLE lot (
    idLot INT IDENTITY (1, 1) PRIMARY KEY,
    idRace INT NOT NULL,
    dateAchat DATE NOT NULL,
    nombreAkoho INT NOT NULL,
    age INT NOT NULL,
    prixAchat DECIMAL(10, 2) NOT NULL,
    poidsInitial DECIMAL(10, 2) NOT NULL DEFAULT 0,
    idLotParent INT NULL,
    CONSTRAINT FK_Lot_LotParent FOREIGN KEY (idLotParent) REFERENCES lot (idLot),
    CONSTRAINT FK_Lot_Race FOREIGN KEY (idRace) REFERENCES race (idRace)
);

CREATE TABLE situation (
    idSituation INT IDENTITY (1, 1) PRIMARY KEY,
    idLot INT NOT NULL,
    dateSituation DATE NOT NULL,
    nombreAkohoVivant INT NOT NULL,
    nombreAkohoMort INT NOT NULL,
    nombreAtody INT NOT NULL,
    age INT NOT NULL,
    CONSTRAINT FK_Situation_Lot FOREIGN KEY (idLot) REFERENCES lot (idLot)
);

CREATE TABLE grossissement (
    idGrossissement INT IDENTITY (1, 1) PRIMARY KEY,
    idRace INT NOT NULL,
    age INT NOT NULL,
    variation DECIMAL(10, 2) NOT NULL,
    poidsSakafo DECIMAL(10, 2) NOT NULL,
    CONSTRAINT FK_Grossissement_Race FOREIGN KEY (idRace) REFERENCES race (idRace)
);

CREATE TABLE typeEvenement (
    idTypeEvenement INT IDENTITY(1,1) PRIMARY KEY,
    libelle NVARCHAR(50) NOT NULL  -- 'MORT', 'ECLOSION', 'VENTE_AKOHO', etc.
);

CREATE TABLE evenement (
    idEvenement INT IDENTITY(1,1) PRIMARY KEY,
    idLot INT NOT NULL,
    idTypeEvenement INT NOT NULL,
    dateEvenement DATE NOT NULL,
    quantite INT NOT NULL,
    note NVARCHAR(255) NULL,
    CONSTRAINT FK_Evenement_Lot FOREIGN KEY (idLot) REFERENCES lot(idLot),
    CONSTRAINT FK_Evenement_Type FOREIGN KEY (idTypeEvenement) REFERENCES typeEvenement(idTypeEvenement)
);

-- Disable all foreign keys for a table
ALTER TABLE YourTable NOCHECK CONSTRAINT ALL;

-- Do your inserts, deletes, or drops
-- ...

-- Re-enable constraints
ALTER TABLE YourTable WITH CHECK CHECK CONSTRAINT ALL;