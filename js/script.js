// Fonction pour aller à l'historique
function allerHistorique() {
    document.getElementById('calculatrice-page').classList.remove('active');
    document.getElementById('historique-page').classList.add('active');
    afficherHistorique();
}

// Fonction pour aller à la conversion
function allerConversion() {
    document.getElementById('calculatrice-page').classList.remove('active');
    document.getElementById('conversion-page').classList.add('active');
    afficherConversion('poids');
}

// Fonction pour retourner à la calculatrice
function retourCalculatrice() {
    document.getElementById('historique-page').classList.remove('active');
    document.getElementById('conversion-page').classList.remove('active');
    document.getElementById('calculatrice-page').classList.add('active');
}

// Fonction pour changer de catégorie de conversion
function changerCategorie(categorie) {
    afficherConversion(categorie);
}