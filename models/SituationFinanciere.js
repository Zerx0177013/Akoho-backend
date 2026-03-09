// class SituationFinanciere {
//     constructor(LotId, PrixSakafoTotal, PrixVenteAkoho, nombreAkohoVivant, nombreAkohoMort, nombreAtody, prixAtodyEstimation, benefice, poidsMoyen) {
//         this.LotId = LotId;
//         this.PrixSakafoTotal = PrixSakafoTotal;
//         this.PrixVenteAkoho = PrixVenteAkoho;
//         this.nombreAkohoVivant = nombreAkohoVivant;
//         this.nombreAkohoMort = nombreAkohoMort;
//         this.nombreAtody = nombreAtody;
//         this.prixAtodyEstimation = prixAtodyEstimation;
//         this.benefice = benefice;
//         this.poidsMoyen = poidsMoyen;
//     }
    
// }

// module.exports = SituationFinanciere;

class SituationFinanciere {
  constructor(lotId, prixSakafoTotal, prixVenteAkoho, nombreAkohoVivant, nombreAkohoMort, nombreAtody, prixAtodyEstimation, benefice, poidsMoyen, race, prixAchat, ageEnSemaine) {
    this.lotId = lotId;
    this.prixSakafoTotal = prixSakafoTotal;
    this.prixVenteAkoho = prixVenteAkoho;
    this.nombreAkohoVivant = nombreAkohoVivant;
    this.nombreAkohoMort = nombreAkohoMort;
    this.nombreAtody = nombreAtody;
    this.prixAtodyEstimation = prixAtodyEstimation;
    this.benefice = benefice;
    this.poidsMoyen = poidsMoyen;
    this.race = race;
    this.prixAchat = prixAchat;
    this.ageEnSemaine = ageEnSemaine;
  }
}
module.exports = SituationFinanciere;