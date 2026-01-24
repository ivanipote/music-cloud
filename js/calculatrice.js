let calcul = '';
let resultat = 0;
let historique = [];

// Charger l'historique du localStorage
function chargerHistorique() {
    const saved = localStorage.getItem('historique');
    if (saved) {
        historique = JSON.parse(saved);
    }
}

// Sauvegarder l'historique
function sauvegarderHistorique() {
    localStorage.setItem('historique', JSON.stringify(historique));
}

// Ajouter un numéro
function ajouterNumero(numero) {
    calcul += numero;
    afficherCalcul();
}

// Ajouter un opérateur
function ajouterOperateur(operateur) {
    if (calcul === '') return;
    calcul += operateur;
    afficherCalcul();
}

// Ajouter un point décimal
function ajouterPoint() {
    if (!calcul.includes('.')) {
        calcul += '.';
        afficherCalcul();
    }
}

// Supprimer le dernier caractère
function supprimerDernier() {
    calcul = calcul.slice(0, -1);
    afficherCalcul();
}

// Effacer le calcul
function effacerCalcul() {
    calcul = '';
    resultat = 0;
    afficherCalcul();
    afficherResultat();
}

// Afficher le calcul en cours
function afficherCalcul() {
    document.getElementById('calcul-en-cours').textContent = calcul || '0';
}

// Afficher le résultat
function afficherResultat() {
    document.getElementById('resultat').textContent = '=' + resultat;
}

// Calculer le résultat
function calculer() {
    if (calcul === '') return;
    
    try {
        // Remplacer les symboles par les opérateurs JavaScript
        let expression = calcul.replace(/÷/g, '/').replace(/×/g, '*');
        
        // Évaluer l'expression
        resultat = eval(expression);
        
        // Appliquer la norme Casio (10 chiffres max)
        if (resultat.toString().length > 10) {
            resultat = parseFloat(resultat.toFixed(8));
        }
        
        // Ajouter à l'historique
        const date = new Date().toLocaleDateString('fr-FR');
        historique.unshift({
            calcul: calcul,
            resultat: resultat,
            date: date
        });
        
        // Garder seulement les 20 derniers calculs
        if (historique.length > 20) {
            historique.pop();
        }
        
        sauvegarderHistorique();
        
        // Réinitialiser pour le prochain calcul
        calcul = resultat.toString();
        afficherCalcul();
        afficherResultat();
        
    } catch (error) {
        resultat = 0;
        afficherResultat();
    }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function() {
    chargerHistorique();
    afficherCalcul();
    afficherResultat();
});