// script.js - Logique principale pour index.html

class MegFoodLibrary {
    constructor() {
        this.affiches = [];
        this.selectedCard = null;
        this.currentFilter = 'recent';
        this.searchQuery = '';
        this.init();
    }
    
    init() {
        console.log('📚 Bibliothèque Meg Food initialisée');
        
        // Charger les affiches sauvegardées
        this.loadAffiches();
        
        // Configurer les événements
        this.setupEventListeners();
        
        // Mettre à jour l'interface
        this.updateUI();
        
        // Vérifier et appliquer le thème
        this.applyTheme();
    }
    
    // Charger les affiches depuis localStorage
    loadAffiches() {
        try {
            const savedAffiches = localStorage.getItem('megFoodAffiches');
            
            if (savedAffiches) {
                this.affiches = JSON.parse(savedAffiches);
                console.log(`📂 ${this.affiches.length} affiche(s) chargée(s)`);
            } else {
                // Affiches par défaut
                this.affiches = [
                    {
                        id: this.generateId(),
                        title: "Promo Été 2024",
                        date: "15 Jan 2024",
                        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
                        data: null, // Données complètes de l'affiche
                        createdAt: new Date('2024-01-15').getTime()
                    },
                    {
                        id: this.generateId(),
                        title: "Menu Spécial",
                        date: "10 Jan 2024",
                        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
                        data: null,
                        createdAt: new Date('2024-01-10').getTime()
                    }
                ];
                
                this.saveAffiches();
            }
        } catch (error) {
            console.error('❌ Erreur de chargement des affiches:', error);
            this.affiches = [];
        }
    }
    
    // Sauvegarder les affiches
    saveAffiches() {
        try {
            localStorage.setItem('megFoodAffiches', JSON.stringify(this.affiches));
            console.log('💾 Affiches sauvegardées');
            return true;
        } catch (error) {
            console.error('❌ Erreur de sauvegarde:', error);
            return false;
        }
    }
    
    // Générer un ID unique
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Configurer les événements
    setupEventListeners() {
        // Bouton Logo - Ouvrir sidebar
        document.getElementById('logoBtn').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Bouton Fermer sidebar
        document.getElementById('closeSidebar').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Bouton + - Créer nouvelle affiche
        document.getElementById('addBtn').addEventListener('click', () => {
            this.createNewAffiche();
        });
        
        // Bouton Créer première affiche
        document.getElementById('createFirstBtn')?.addEventListener('click', () => {
            this.createNewAffiche();
        });
        
        // Barre de recherche
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim();
            this.updateUI();
            
            // Afficher/masquer bouton effacer
            if (this.searchQuery) {
                clearSearch.style.opacity = '1';
            } else {
                clearSearch.style.opacity = '0';
            }
        });
        
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            this.searchQuery = '';
            this.updateUI();
            clearSearch.style.opacity = '0';
        });
        
        // Filtre
        const filterBtn = document.getElementById('filterBtn');
        const filterDropdown = document.getElementById('filterDropdown');
        
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('active');
        });
        
        // Options de filtre
        document.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.currentFilter = e.currentTarget.dataset.filter;
                filterDropdown.classList.remove('active');
                this.updateUI();
                
                // Mettre à jour le texte du bouton filtre
                const filterText = e.currentTarget.textContent.trim();
                filterBtn.innerHTML = `<i class="fas fa-filter"></i> ${filterText}`;
            });
        });
        
        // Fermer le dropdown filtre en cliquant ailleurs
        document.addEventListener('click', () => {
            filterDropdown.classList.remove('active');
        });
        
        // Toggle Dark/Light Mode
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('change', () => {
            this.toggleTheme();
        });
        
        // Calculer l'espace de stockage
        this.calculateStorage();
    }
    
    // Créer une nouvelle affiche
    createNewAffiche() {
        // Demander le titre d'abord
        const title = prompt('Donnez un titre à votre affiche :');
        
        if (!title || title.trim() === '') {
            alert('Le titre est obligatoire pour créer une affiche.');
            return;
        }
        
        // Créer l'objet affiche
        const affiche = {
            id: this.generateId(),
            title: title.trim(),
            date: this.getCurrentDate(),
            image: this.getDefaultImage(), // Image par défaut bleu ciel
            data: null, // Données de l'éditeur seront ajoutées plus tard
            createdAt: Date.now()
        };
        
        // Ajouter à la liste
        this.affiches.push(affiche);
        this.saveAffiches();
        
        // Rediriger vers l'éditeur avec l'ID de l'affiche
        window.location.href = `editor.html?id=${affiche.id}&title=${encodeURIComponent(affiche.title)}`;
    }
    
    // Obtenir la date actuelle formatée
    getCurrentDate() {
        const now = new Date();
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return now.toLocaleDateString('fr-FR', options);
    }
    
    // Image par défaut (bleu ciel)
    getDefaultImage() {
        return 'data:image/svg+xml;base64,' + btoa(`
            <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
                <rect width="500" height="500" fill="#87CEEB"/>
                <text x="250" y="250" font-family="Arial" font-size="24" 
                      fill="white" text-anchor="middle" dy=".3em">
                    ${document.getElementById('siteTitle')?.value || 'MEG FOOD'}
                </text>
            </svg>
        `);
    }
    
    // Vérifier si une image est valide
    isValidImage(url) {
        if (!url) return false;
        
        // Vérifier les URL de données
        if (url.startsWith('data:image')) {
            return true;
        }
        
        // Vérifier les URLs externes
        if (url.startsWith('http')) {
            return true;
        }
        
        return false;
    }
    
    // Trier les affiches selon le filtre
    getSortedAffiches() {
        let filtered = [...this.affiches];
        
        // Appliquer la recherche
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(affiche => 
                affiche.title.toLowerCase().includes(query)
            );
        }
        
        // Appliquer le filtre
        switch (this.currentFilter) {
            case 'a-z':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
                
            case 'z-a':
                filtered.sort((a, b) => b.title.localeCompare(a.title));
                break;
                
            case 'recent':
                filtered.sort((a, b) => b.createdAt - a.createdAt);
                break;
                
            case 'ancien':
                filtered.sort((a, b) => a.createdAt - b.createdAt);
                break;
        }
        
        return filtered;
    }
    
    // Mettre à jour l'interface
    updateUI() {
        const affichesGrid = document.getElementById('affichesGrid');
        const emptyState = document.getElementById('emptyState');
        const afficheCount = document.getElementById('afficheCount');
        const fileCount = document.getElementById('fileCount');
        
        // Obtenir les affiches triées
        const sortedAffiches = this.getSortedAffiches();
        
        // Mettre à jour les compteurs
        afficheCount.textContent = `${sortedAffiches.length} affiche(s)`;
        fileCount.innerHTML = `<i class="fas fa-file"></i> <span>${sortedAffiches.length} sauvegardées</span>`;
        
        // Afficher/masquer l'état vide
        if (sortedAffiches.length === 0) {
            emptyState.classList.add('active');
            affichesGrid.innerHTML = '';
        } else {
            emptyState.classList.remove('active');
            this.renderAffichesGrid(sortedAffiches);
        }
        
        // Mettre à jour l'espace de stockage
        this.calculateStorage();
    }
    
    // Rendre la grille d'affiches
    renderAffichesGrid(affiches) {
        const affichesGrid = document.getElementById('affichesGrid');
        
        affichesGrid.innerHTML = affiches.map(affiche => `
            <div class="affiche-card" 
                 data-id="${affiche.id}"
                 data-title="${affiche.title}"
                 data-date="${affiche.date}"
                 data-image="${affiche.image}">
                
                <div class="card-header">
                    <h3 class="card-title">${affiche.title}</h3>
                </div>
                
                <div class="card-main">
                    <div class="card-images">
                        <div class="card-image" 
                             style="background-image: url('${this.isValidImage(affiche.image) ? affiche.image : this.getDefaultImage()}')">
                        </div>
                    </div>
                </div>
                
                <div class="card-footer">
                    <span class="card-date">
                        <i class="far fa-calendar"></i>
                        ${affiche.date}
                    </span>
                </div>
            </div>
        `).join('');
        
        // Ajouter les événements aux cartes
        this.setupCardEvents();
    }
    
    // Configurer les événements des cartes
    setupCardEvents() {
        const cards = document.querySelectorAll('.affiche-card');
        
        cards.forEach(card => {
            const cardId = card.dataset.id;
            
            // Clic simple - Visualiser l'affiche
            card.addEventListener('click', (e) => {
                // Vérifier si ce n'est pas un appui long
                if (!card.classList.contains('long-press')) {
                    this.viewAffiche(cardId);
                }
                card.classList.remove('long-press');
            });
            
            // Appui long sera géré par tache.js
        });
    }
    
    // Visualiser une affiche
    viewAffiche(afficheId) {
        const affiche = this.affiches.find(a => a.id === afficheId);
        
        if (affiche) {
            if (affiche.data) {
                // Affiche complète - ouvrir en mode lecture
                sessionStorage.setItem('currentAfficheData', JSON.stringify(affiche.data));
                window.open('lecture.html', '_blank');
            } else {
                // Affiche non complétée - éditer
                window.location.href = `editor.html?id=${affiche.id}&title=${encodeURIComponent(affiche.title)}`;
            }
        }
    }
    
    // Toggle sidebar
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('active');
    }
    
    // Gérer le thème
    toggleTheme() {
        const isDark = document.body.classList.contains('dark-mode');
        
        if (isDark) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('megFoodTheme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('megFoodTheme', 'dark');
        }
    }
    
    // Appliquer le thème sauvegardé
    applyTheme() {
        const savedTheme = localStorage.getItem('megFoodTheme') || 'light';
        const themeToggle = document.getElementById('themeToggle');
        
        document.body.classList.remove('dark-mode', 'light-mode');
        document.body.classList.add(savedTheme + '-mode');
        
        if (themeToggle) {
            themeToggle.checked = savedTheme === 'dark';
        }
    }
    
    // Calculer l'espace de stockage utilisé
    calculateStorage() {
        try {
            // Calculer la taille des données
            const affichesData = JSON.stringify(this.affiches);
            const usedKB = Math.round(affichesData.length / 1024);
            const totalKB = 5 * 1024; // 5 MB
            
            // Calculer le pourcentage
            const percentage = Math.min((usedKB / totalKB) * 100, 100);
            
            // Mettre à jour l'interface
            const progressBar = document.getElementById('storageProgress');
            const storageUsed = document.getElementById('storageUsed');
            const storageTotal = document.getElementById('storageTotal');
            
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
            
            if (storageUsed) {
                storageUsed.textContent = usedKB >= 1024 
                    ? `${(usedKB / 1024).toFixed(1)} MB` 
                    : `${usedKB} KB`;
            }
            
            if (storageTotal) {
                storageTotal.textContent = '5 MB';
            }
        } catch (error) {
            console.error('Erreur de calcul du stockage:', error);
        }
    }
    
    // Obtenir une affiche par ID
    getAfficheById(id) {
        return this.affiches.find(a => a.id === id);
    }
    
    // Mettre à jour une affiche
    updateAffiche(afficheId, updates) {
        const index = this.affiches.findIndex(a => a.id === afficheId);
        
        if (index !== -1) {
            this.affiches[index] = { ...this.affiches[index], ...updates };
            this.saveAffiches();
            this.updateUI();
            return true;
        }
        
        return false;
    }
    
    // Supprimer une affiche
    deleteAffiche(afficheId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette affiche ?')) {
            this.affiches = this.affiches.filter(a => a.id !== afficheId);
            this.saveAffiches();
            this.updateUI();
            return true;
        }
        
        return false;
    }
}

// Initialiser la bibliothèque
document.addEventListener('DOMContentLoaded', () => {
    window.megFoodLibrary = new MegFoodLibrary();
});