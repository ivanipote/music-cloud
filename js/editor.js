// editor.js - Éditeur Meg Food (version optimisée)

class MegFoodEditor {
    constructor() {
        this.defaultData = this.getDefaultData();
        this.currentData = { ...this.defaultData };
        this.uploadedImages = {
            product1: null,
            product2: null,
            product3: null
        };
        
        this.isSaving = false;
        this.init();
    }
    
    // Données par défaut
    getDefaultData() {
        return {
            // Header
            logoEmoji: '😋',
            siteTitle: 'MEG FOOD',
            promoText: 'PROMO',
            
            // Images produits
            product1Label: 'Pizza',
            product1Image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            
            product2Label: 'Burger',
            product2Image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            
            product3Label: 'Salade',
            product3Image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            
            // Typographie
            mainFontStyle: "'Poppins', sans-serif",
            titleSize: '17',
            descSize: '16',
            
            // Contacts
            contactsTitle: 'Contactez-nous',
            whatsappNumber: '+225 05 03 58 83 36',
            phoneNumber: '+225 05 03 58 83 36',
            emailAddress: 'contact@megfood.com',
            descriptionText: 'Chez Meg Food, nous mettons un point d\'honneur à vous offrir des plats préparés avec des ingrédients frais et de qualité supérieure. Notre équipe de chefs passionnés crée chaque jour des recettes uniques qui raviront vos papilles.',
            
            // Métadonnées
            lastModified: null
        };
    }
    
    // Initialisation
    init() {
        console.log('⚡ Éditeur Meg Food initialisé');
        
        this.setupEventListeners();
        this.loadSavedData();
        this.updateUI();
    }
    
    // Configurer les événements
    setupEventListeners() {
        // Boutons de sauvegarde et prévisualisation
        document.getElementById('saveBtn').addEventListener('click', () => this.saveData());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewData());
        
        // Upload des produits
        document.querySelectorAll('.upload-btn[data-target]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-target');
                const fileInput = document.getElementById(`${target}File`);
                if (fileInput) {
                    fileInput.value = ''; // Réinitialiser pour permettre le re-upload
                    fileInput.click();
                }
            });
        });
        
        document.querySelectorAll('.file-input[data-target]').forEach(input => {
            input.addEventListener('change', (e) => {
                const target = e.target.getAttribute('data-target');
                this.handleImageUpload(e, target);
            });
        });
        
        // Suggestions d'emojis
        document.querySelectorAll('.emoji-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', (e) => {
                const emoji = e.currentTarget.getAttribute('data-emoji');
                document.getElementById('logoEmoji').value = emoji;
                this.currentData.logoEmoji = emoji;
                this.updateFormField('logoEmoji', emoji);
            });
        });
        
        // Événements de changement pour tous les inputs
        this.setupInputListeners();
        
        // Prévenir la fermeture si données non sauvegardées
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';
            }
        });
    }
    
    // Configurer les écouteurs pour les inputs
    setupInputListeners() {
        const inputConfigs = [
            { id: 'logoEmoji', event: 'input' },
            { id: 'siteTitle', event: 'input' },
            { id: 'promoText', event: 'input' },
            { id: 'product1Label', event: 'input' },
            { id: 'product2Label', event: 'input' },
            { id: 'product3Label', event: 'input' },
            { id: 'contactsTitle', event: 'input' },
            { id: 'whatsappNumber', event: 'input' },
            { id: 'phoneNumber', event: 'input' },
            { id: 'emailAddress', event: 'input' },
            { id: 'descriptionText', event: 'input' },
            { id: 'mainFontStyle', event: 'change' },
            { id: 'titleSize', event: 'change' },
            { id: 'descSize', event: 'change' }
        ];
        
        inputConfigs.forEach(config => {
            const element = document.getElementById(config.id);
            if (element) {
                element.addEventListener(config.event, (e) => {
                    this.currentData[config.id] = e.target.value;
                    this.updateCurrentImageDisplay(config.id);
                    this.markAsModified(config.id);
                });
            }
        });
    }
    
    // Gérer l'upload d'images
    handleImageUpload(event, target) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Vérifications rapides
        if (!file.type.match('image.*')) {
            this.showNotification('Veuillez sélectionner une image valide', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('L\'image est trop volumineuse (max 5MB)', 'error');
            return;
        }
        
        // Désactiver le bouton pendant l'upload
        const uploadBtn = event.target.previousElementSibling;
        const originalText = uploadBtn.innerHTML;
        uploadBtn.innerHTML = '⏳ Upload...';
        uploadBtn.disabled = true;
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            // Stocker l'image
            this.uploadedImages[target] = e.target.result;
            
            // Mettre à jour les données
            this.currentData[`${target}Image`] = e.target.result;
            
            // Afficher l'aperçu
            this.updatePreviewImage(`previewImage${target.charAt(target.length-1)}`, e.target.result);
            
            // Mettre à jour le nom d'image actuelle
            this.updateCurrentImageDisplay(`${target}Label`);
            
            // Réactiver le bouton
            uploadBtn.innerHTML = originalText;
            uploadBtn.disabled = false;
            
            this.showNotification(`✅ Image ${target} uploadée avec succès`);
            this.markAsModified(`${target}Image`);
        };
        
        reader.onerror = () => {
            this.showNotification('❌ Erreur lors de la lecture de l\'image', 'error');
            uploadBtn.innerHTML = originalText;
            uploadBtn.disabled = false;
        };
        
        // Lire le fichier
        reader.readAsDataURL(file);
    }
    
    // Mettre à jour l'aperçu d'image
    updatePreviewImage(previewId, imageData) {
        const preview = document.getElementById(previewId);
        if (preview) {
            // Créer une image temporaire pour vérifier le chargement
            const tempImg = new Image();
            tempImg.onload = () => {
                preview.src = imageData;
                preview.style.display = 'block';
                preview.style.opacity = '1';
            };
            tempImg.onerror = () => {
                preview.style.display = 'none';
                this.showNotification('❌ Erreur de chargement de l\'image', 'error');
            };
            tempImg.src = imageData;
        }
    }
    
    // Mettre à jour l'affichage des images actuelles
    updateCurrentImageDisplay(inputId) {
        if (inputId.includes('Label')) {
            const productNum = inputId.replace('product', '').replace('Label', '');
            const labelElement = document.getElementById(`currentImage${productNum}`);
            if (labelElement) {
                labelElement.textContent = this.currentData[inputId] || this.defaultData[inputId];
            }
        }
    }
    
    // Marquer un champ comme modifié
    markAsModified(fieldId) {
        const element = document.getElementById(fieldId);
        if (element) {
            element.classList.add('modified');
            setTimeout(() => element.classList.remove('modified'), 1000);
        }
    }
    
    // Charger les données sauvegardées
    loadSavedData() {
        try {
            const savedData = localStorage.getItem('megFoodAffiche');
            
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                
                // Fusionner avec les données par défaut
                this.currentData = { ...this.defaultData, ...parsedData };
                
                // Restaurer les images uploadées
                Object.keys(this.uploadedImages).forEach(key => {
                    if (this.currentData[`${key}Image`] && this.currentData[`${key}Image`].startsWith('data:')) {
                        this.uploadedImages[key] = this.currentData[`${key}Image`];
                    }
                });
                
                this.showNotification('📂 Données chargées depuis la sauvegarde');
                console.log('📂 Données chargées:', this.currentData);
            }
        } catch (error) {
            console.error('❌ Erreur de chargement:', error);
            this.showNotification('❌ Erreur de chargement des données', 'error');
        }
    }
    
    // Sauvegarder les données
    async saveData() {
        if (this.isSaving) return;
        
        this.isSaving = true;
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.innerHTML;
        
        try {
            // Animation du bouton
            saveBtn.innerHTML = '💾 Sauvegarde...';
            saveBtn.disabled = true;
            
            // Collecter les données
            this.collectFormData();
            
            // Ajouter les images uploadées
            Object.keys(this.uploadedImages).forEach(key => {
                if (this.uploadedImages[key]) {
                    this.currentData[`${key}Image`] = this.uploadedImages[key];
                }
            });
            
            // Ajouter la date de modification
            this.currentData.lastModified = new Date().toISOString();
            
            // Simuler un délai pour l'animation
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Sauvegarder dans localStorage
            localStorage.setItem('megFoodAffiche', JSON.stringify(this.currentData));
            
            // Mettre à jour l'interface
            this.updateUI();
            
            // Afficher la confirmation
            this.showNotification('✅ Modifications sauvegardées avec succès !');
            console.log('💾 Données sauvegardées:', this.currentData);
            
            // Créer une miniature pour la galerie
            this.createGalleryThumbnail();
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur de sauvegarde:', error);
            this.showNotification('❌ Erreur lors de la sauvegarde', 'error');
            return false;
            
        } finally {
            // Réactiver le bouton
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            this.isSaving = false;
        }
    }
    
    // Collecter les données du formulaire
    collectFormData() {
        // Récupérer toutes les valeurs
        const elements = document.querySelectorAll('input, select, textarea');
        elements.forEach(element => {
            const id = element.id;
            if (id && this.currentData.hasOwnProperty(id)) {
                if (element.type === 'checkbox') {
                    this.currentData[id] = element.checked;
                } else {
                    this.currentData[id] = element.value;
                }
            }
        });
    }
    
    // Créer une miniature pour la galerie
    createGalleryThumbnail() {
        const thumbnailData = {
            id: Date.now(),
            title: this.currentData.siteTitle || 'Meg Food',
            shortTitle: (this.currentData.siteTitle || 'Meg Food').substring(0, 15) + '...',
            image: this.currentData.product1Image || '',
            date: new Date().toLocaleDateString('fr-FR'),
            timestamp: Date.now(),
            data: { ...this.currentData }
        };
        
        // Sauvegarder dans la liste des affiches
        const affiches = JSON.parse(localStorage.getItem('megFoodAffiches') || '[]');
        
        // Vérifier si cette affiche existe déjà (même titre et contenu similaire)
        const existingIndex = affiches.findIndex(a => 
            a.data.siteTitle === this.currentData.siteTitle && 
            Math.abs(a.timestamp - Date.now()) < 60000 // Dans la dernière minute
        );
        
        if (existingIndex !== -1) {
            // Mettre à jour l'existante
            affiches[existingIndex] = thumbnailData;
        } else {
            // Ajouter la nouvelle
            affiches.unshift(thumbnailData);
        }
        
        // Limiter à 20 affiches
        localStorage.setItem('megFoodAffiches', JSON.stringify(affiches.slice(0, 20)));
        
        console.log('🖼️ Miniature créée:', thumbnailData.title);
    }
    
    // Mettre à jour l'interface
    updateUI() {
        // Remplir les champs avec les données actuelles
        Object.keys(this.currentData).forEach(key => {
            const element = document.getElementById(key);
            if (element && this.currentData[key] !== null) {
                if (element.type === 'checkbox') {
                    element.checked = this.currentData[key];
                } else {
                    element.value = this.currentData[key];
                }
            }
        });
        
        // Mettre à jour les aperçus d'images
        this.updateImagePreviews();
        
        // Mettre à jour les noms d'images actuelles
        this.updateCurrentImageNames();
    }
    
    // Mettre à jour les aperçus d'images
    updateImagePreviews() {
        // Produits
        for (let i = 1; i <= 3; i++) {
            const imageData = this.currentData[`product${i}Image`];
            if (imageData && imageData.startsWith('data:')) {
                this.updatePreviewImage(`previewImage${i}`, imageData);
            }
        }
    }
    
    // Mettre à jour les noms d'images actuelles
    updateCurrentImageNames() {
        for (let i = 1; i <= 3; i++) {
            const labelElement = document.getElementById(`currentImage${i}`);
            if (labelElement) {
                const label = this.currentData[`product${i}Label`] || this.defaultData[`product${i}Label`];
                labelElement.textContent = label;
            }
        }
    }
    
    // Prévisualiser les données
    previewData() {
        // Sauvegarder d'abord
        this.saveData().then(success => {
            if (success) {
                // Stocker les données pour la prévisualisation
                sessionStorage.setItem('megFoodPreviewData', JSON.stringify(this.currentData));
                
                // Ouvrir l'affiche dans un nouvel onglet
                window.open('lecture.html', '_blank');
                
                this.showNotification('👁️ Prévisualisation ouverte');
                console.log('👁️ Prévisualisation lancée');
            }
        });
    }
    
    // Vérifier s'il y a des modifications non sauvegardées
    hasUnsavedChanges() {
        // Comparer les données actuelles avec les données sauvegardées
        const savedData = localStorage.getItem('megFoodAffiche');
        if (!savedData) return true; // Aucune sauvegarde
        
        try {
            const saved = JSON.parse(savedData);
            return JSON.stringify(this.currentData) !== JSON.stringify(saved);
        } catch {
            return true;
        }
    }
    
    // Mettre à jour un champ du formulaire
    updateFormField(fieldId, value) {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = value;
            this.currentData[fieldId] = value;
        }
    }
    
    // Afficher une notification
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const text = document.getElementById('notificationText');
        const icon = document.querySelector('.notification-icon');
        
        if (!notification || !text || !icon) return;
        
        // Mettre à jour le contenu
        text.textContent = message;
        
        // Changer l'icône selon le type
        switch(type) {
            case 'error':
                icon.textContent = '❌';
                notification.style.boxShadow = 
                    '10px 10px 20px #b5b5b5, -10px -10px 20px #ffffff, 0 0 0 2px #e74c3c';
                break;
            case 'warning':
                icon.textContent = '⚠️';
                notification.style.boxShadow = 
                    '10px 10px 20px #b5b5b5, -10px -10px 20px #ffffff, 0 0 0 2px #f39c12';
                break;
            default:
                icon.textContent = '✅';
                notification.style.boxShadow = 
                    '10px 10px 20px #b5b5b5, -10px -10px 20px #ffffff, 0 0 0 2px #27ae60';
        }
        
        // Afficher la notification
        notification.classList.add('show');
        
        // Masquer après 2 secondes
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }
    
    // Réinitialiser aux valeurs par défaut
    resetToDefault() {
        if (confirm('Voulez-vous vraiment réinitialiser toutes les modifications ?')) {
            this.currentData = { ...this.defaultData };
            this.uploadedImages = {
                product1: null,
                product2: null,
                product3: null
            };
            
            localStorage.removeItem('megFoodAffiche');
            this.updateUI();
            
            this.showNotification('✅ Réinitialisation complète effectuée');
        }
    }
}

// Initialiser l'éditeur au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.megFoodEditor = new MegFoodEditor();
});

// Fonctions utilitaires globales
window.megFoodUtils = {
    // Vider toutes les données
    clearAllData: () => {
        if (confirm('⚠️ Voulez-vous vraiment supprimer TOUTES les données ?')) {
            localStorage.removeItem('megFoodAffiche');
            localStorage.removeItem('megFoodAffiches');
            sessionStorage.clear();
            location.reload();
        }
    },
    
    // Exporter les données
    exportData: () => {
        const data = localStorage.getItem('megFoodAffiche');
        if (data) {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'meg-food-affiche.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    },
    
    // Importer des données
    importData: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        localStorage.setItem('megFoodAffiche', JSON.stringify(data));
                        location.reload();
                    } catch {
                        alert('❌ Fichier invalide');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
};

// Log de démarrage
console.log('🚀 Meg Food Editor prêt à l\'emploi');