let categorieActive = 'poids';
let tauxChange = {};
let uniteSelectionnee1 = {};
let uniteSelectionnee2 = {};

// Unités de conversion
const unites = {
    poids: {
        nom: 'POIDS',
        liste: [
            { nom: 'Kg', facteur: 1 },
            { nom: 'g', facteur: 1000 },
            { nom: 'mg', facteur: 1000000 },
            { nom: 't', facteur: 0.001 },
            { nom: 'oz', facteur: 35.274 }
        ]
    },
    longueur: {
        nom: 'LONGUEUR',
        liste: [
            { nom: 'm', facteur: 1 },
            { nom: 'km', facteur: 0.001 },
            { nom: 'cm', facteur: 100 },
            { nom: 'mm', facteur: 1000 },
            { nom: 'miles', facteur: 0.000621371 }
        ]
    },
    finance: {
        nom: 'FINANCE',
        liste: [
            { nom: 'FCFA', facteur: 1 },
            { nom: 'EUR', facteur: 0.0015 },
            { nom: 'USD', facteur: 0.0016 },
            { nom: 'GBP', facteur: 0.0013 },
            { nom: 'JPY', facteur: 0.17 }
        ]
    }
};

// Charger les taux de change
async function chargerTauxChange() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/XOF');
        const data = await response.json();
        tauxChange = {
            EUR: data.rates.EUR,
            USD: data.rates.USD,
            GBP: data.rates.GBP,
            JPY: data.rates.JPY
        };
        
        // Mettre à jour les facteurs finance
        unites.finance.liste[1].facteur = tauxChange.EUR;
        unites.finance.liste[2].facteur = tauxChange.USD;
        unites.finance.liste[3].facteur = tauxChange.GBP;
        unites.finance.liste[4].facteur = tauxChange.JPY;
    } catch (error) {
        console.log('Erreur chargement taux de change');
    }
}

// Afficher la conversion
function afficherConversion(categorie) {
    categorieActive = categorie;
    const contenuConversion = document.getElementById('contenu-conversion');
    contenuConversion.innerHTML = '';
    
    // Mettre à jour le bouton actif
    document.querySelectorAll('.btn-categorie').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Initialiser les unités sélectionnées
    uniteSelectionnee1 = unites[categorie].liste[0];
    uniteSelectionnee2 = unites[categorie].liste[1];
    
    if (categorie === 'poids') {
        afficherPoids();
    } else if (categorie === 'longueur') {
        afficherLongueur();
    } else if (categorie === 'finance') {
        afficherFinance();
    }
}

// Ouvrir modal pour sélectionner unité
function ouvrirModalUnite(position) {
    const categorie = categorieActive;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-unite';
    
    const contenuModal = document.createElement('div');
    contenuModal.className = 'modal-content';
    
    const titre = document.createElement('h3');
    titre.textContent = `Sélectionner unité ${position === 1 ? '1' : '2'}`;
    titre.style.color = '#000000';
    titre.style.textAlign = 'center';
    titre.style.marginBottom = '20px';
    contenuModal.appendChild(titre);
    
    unites[categorie].liste.forEach(function(unite) {
        const btn = document.createElement('button');
        btn.className = 'btn-unite-modal';
        btn.textContent = unite.nom;
        btn.onclick = function() {
            if (position === 1) {
                uniteSelectionnee1 = unite;
            } else {
                uniteSelectionnee2 = unite;
            }
            document.getElementById('modal-unite').remove();
            
            if (categorie === 'poids') {
                afficherPoids();
            } else if (categorie === 'longueur') {
                afficherLongueur();
            } else if (categorie === 'finance') {
                afficherFinance();
            }
        };
        contenuModal.appendChild(btn);
    });
    
    const btnFermer = document.createElement('button');
    btnFermer.className = 'btn-fermer-modal';
    btnFermer.textContent = 'Fermer';
    btnFermer.onclick = function() {
        document.getElementById('modal-unite').remove();
    };
    contenuModal.appendChild(btnFermer);
    
    modal.appendChild(contenuModal);
    document.body.appendChild(modal);
}

// Afficher conversion poids
function afficherPoids() {
    const contenuConversion = document.getElementById('contenu-conversion');
    contenuConversion.innerHTML = `
        <div class="conversion-group">
            <input type="number" id="input-conversion-1" class="input-conversion" placeholder="0.0" value="0.0">
            <button class="btn-unite-select" onclick="ouvrirModalUnite(1)">${uniteSelectionnee1.nom}</button>
        </div>
        <button class="btn-convertir" onclick="convertir()">🔄</button>
        <div class="conversion-group">
            <div class="output-conversion" id="output-conversion-2">0.0</div>
            <button class="btn-unite-select" onclick="ouvrirModalUnite(2)">${uniteSelectionnee2.nom}</button>
        </div>
    `;
}

// Afficher conversion longueur
function afficherLongueur() {
    const contenuConversion = document.getElementById('contenu-conversion');
    contenuConversion.innerHTML = `
        <div class="conversion-group">
            <input type="number" id="input-conversion-1" class="input-conversion" placeholder="0.0" value="0.0">
            <button class="btn-unite-select" onclick="ouvrirModalUnite(1)">${uniteSelectionnee1.nom}</button>
        </div>
        <button class="btn-convertir" onclick="convertir()">🔄</button>
        <div class="conversion-group">
            <div class="output-conversion" id="output-conversion-2">0.0</div>
            <button class="btn-unite-select" onclick="ouvrirModalUnite(2)">${uniteSelectionnee2.nom}</button>
        </div>
    `;
}

// Afficher conversion finance
function afficherFinance() {
    const contenuConversion = document.getElementById('contenu-conversion');
    contenuConversion.innerHTML = `
        <div class="conversion-group">
            <input type="number" id="input-conversion-1" class="input-conversion" placeholder="0.0" value="0.0">
            <button class="btn-unite-select" onclick="ouvrirModalUnite(1)">${uniteSelectionnee1.nom}</button>
        </div>
        <button class="btn-convertir" onclick="convertir()">🔄</button>
        <div class="conversion-group">
            <div class="output-conversion" id="output-conversion-2">0.0</div>
            <button class="btn-unite-select" onclick="ouvrirModalUnite(2)">${uniteSelectionnee2.nom}</button>
        </div>
    `;
}

// Convertir
function convertir() {
    const input = parseFloat(document.getElementById('input-conversion-1').value) || 0;
    
    // Convertir de l'unité 1 vers la base (facteur 1)
    const valeurBase = input / uniteSelectionnee1.facteur;
    
    // Convertir de la base vers l'unité 2
    const resultat = valeurBase * uniteSelectionnee2.facteur;
    
    document.getElementById('output-conversion-2').textContent = resultat.toFixed(6);
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function() {
    chargerTauxChange();
});