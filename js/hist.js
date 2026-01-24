// Afficher l'historique
function afficherHistorique() {
    const contenuHistorique = document.getElementById('contenu-historique');
    contenuHistorique.innerHTML = '';
    
    if (historique.length === 0) {
        contenuHistorique.innerHTML = '<p style="color: #000000; text-align: center; margin-top: 50px;">Aucun calcul</p>';
        return;
    }
    
    // Afficher les calculs du plus récent au plus ancien
    historique.forEach(function(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-historique';
        
        const calculDiv = document.createElement('div');
        calculDiv.className = 'calcul-item';
        calculDiv.textContent = item.calcul + '=' + item.resultat;
        
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-item';
        dateDiv.textContent = item.date;
        
        itemDiv.appendChild(calculDiv);
        itemDiv.appendChild(dateDiv);
        contenuHistorique.appendChild(itemDiv);
    });
}