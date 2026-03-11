CREATE DATABASE akoho;

USE akoho;

CREATE TABLE race(
    idRace INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    prixAchatSakafo DECIMAL(10, 2) NOT NULL,
    prixVenteAkoho DECIMAL(10, 2) NOT NULL,
    prixVenteAtody DECIMAL(10, 2) NOT NULL
);

CREATE TABLE lot(
    idLot INT PRIMARY KEY AUTO_INCREMENT,
    idRace INT NOT NULL,
    dateAchat DATE NOT NULL,
    nombreAkoho INT NOT NULL,
    prixAchat DECIMAL(10, 2) NOT NULL,
    age INT NOT NULL,
    poidsInitial DECIMAL(10, 2) NOT NULL DEFAULT 0,
    FOREIGN KEY (idRace) REFERENCES race(idRace)
);

CREATE TABLE situation(
    idSituation INT PRIMARY KEY AUTO_INCREMENT,
    idLot INT NOT NULL,
    dateSituation DATE NOT NULL,
    nombreAkohoVivant INT NOT NULL,
    nombreAkohoMort INT NOT NULL,
    nombreAtody INT NOT NULL,
    age INT NOT NULL,
    FOREIGN KEY (idLot) REFERENCES lot(idLot)
);

CREATE TABLE grossissement(
    idGrossissement INT PRIMARY KEY AUTO_INCREMENT,
    idRace INT NOT NULL,
    variation DECIMAL(10, 2) NOT NULL,
    poidsSakafo DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (idRace) REFERENCES race(idRace)
);