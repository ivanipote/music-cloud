// tache.js - Gestion de l'appui long et barre de tâches

class TaskManager {
    constructor() {
        this.longPressTimer = null;
        this.longPressDuration = 800; // 0.8 secondes
        this.selectedCard = null;
        this.isLongPress = false;
        this.isTaskbarActive = false;
        this.init();
    }
    
    init() {
        console.log('🎯 Task Manager initialisé');
        
        // Configurer les événements globaux
        this.setupGlobalEvents();
        
        // Configurer la barre de tâches
        this.setupTaskbar();
        
        // Configurer les écouteurs de fermeture
        this.setupCloseListeners();
    }
    
    setupGlobalEvents() {
        // Détection d'appui long sur les cartes
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        document.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
        
        // Empêcher le menu contextuel sur les cartes
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.affiche-card')) {
                e.preventDefault();
            }
        });
    }
    
    handleMouseDown(e) {
        // Si on clique sur une carte
        const card = e.target.closest('.affiche-card');
        if (card) {
            this.startLongPress(card);
        }
        // Si on clique ailleurs que sur une carte ET que la barre de tâches est active
        else if (this.isTaskbarActive) {
            // Vérifier si on ne clique pas sur la barre de tâches elle-même
            if (!e.target.closest('.taskbar') && !e.target.closest('.card-modal')) {
                this.hideCardOptions();
            }
        }
    }
    
    handleTouchStart(e) {
        const card = e.target.closest('.affiche-card');
        if (card) {
            this.startLongPress(card);
        }
        // Gestion du touch ailleurs
        else if (this.isTaskbarActive && e.changedTouches[0]) {
            const touch = e.changedTouches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            
            if (!element.closest('.taskbar') && !element.closest('.card-modal')) {
                this.hideCardOptions();
            }
        }
    }
    
    startLongPress(card) {
        this.isLongPress = false;
        this.selectedCard = card;
        
        this.longPressTimer = setTimeout(() => {
            this.isLongPress = true;
            this.showCardOptions(card);
        }, this.longPressDuration);
        
        // Ajouter une classe pour feedback visuel
        card.classList.add('pressing');
        
        // Vibrer sur mobile (si supporté)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    handleMouseUp(e) {
        this.cancelLongPress();
    }
    
    handleTouchEnd(e) {
        this.cancelLongPress();
    }
    
    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.selectedCard) {
            this.selectedCard.classList.remove('pressing');
            
            // Si c'était un appui long, marquer la carte
            if (this.isLongPress) {
                this.selectedCard.classList.add('long-press');
                setTimeout(() => {
                    this.selectedCard.classList.remove('long-press');
                }, 300);
                this.isLongPress = false;
            }
        }
    }
    
    showCardOptions(card) {
        const cardId = card.dataset.id;
        const cardTitle = card.dataset.title;
        
        // Marquer que la barre de tâches est active
        this.isTaskbarActive = true;
        
        // Afficher l'overlay flou
        document.getElementById('overlayBlur').classList.add('active');
        
        // Afficher la carte zoomée
        this.showZoomedCard(card);
        
        // Afficher la barre de tâches
        this.showTaskbar(cardId);
        
        console.log(`📱 Options pour la carte: ${cardTitle}`);
    }
    
    showZoomedCard(card) {
        const modal = document.getElementById('cardModal');
        const modalContent = document.getElementById('modalCardContent');
        
        // Cloner le contenu de la carte
        const cardClone = card.cloneNode(true);
        cardClone.style.width = '280px';
        cardClone.style.height = '280px';
        cardClone.style.margin = '0';
        cardClone.style.cursor = 'default';
        
        // Désactiver les événements sur le clone
        cardClone.onclick = null;
        cardClone.onmousedown = null;
        cardClone.ontouchstart = null;
        
        // Ajouter au modal
        modalContent.innerHTML = '';
        modalContent.appendChild(cardClone);
        
        // Afficher le modal
        modal.classList.add('active');
    }
    
    setupTaskbar() {
        const taskbar = document.getElementById('taskbar');
        
        // Actions des boutons de la barre de tâches
        document.querySelectorAll('.taskbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.currentTarget.dataset.action;
                this.handleTaskbarAction(action);
            });
        });
    }
    
    setupCloseListeners() {
        const overlay = document.getElementById('overlayBlur');
        const modal = document.getElementById('cardModal');
        
        // Fermer en cliquant sur l'overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideCardOptions();
            }
        });
        
        // Fermer en cliquant sur le modal (sauf sur la carte)
        modal.addEventListener('click', (e) => {
            if (!e.target.closest('.affiche-card')) {
                this.hideCardOptions();
            }
        });
        
        // Fermer avec la touche Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isTaskbarActive) {
                this.hideCardOptions();
            }
        });
        
        // Fermer en scrollant
        window.addEventListener('wheel', () => {
            if (this.isTaskbarActive) {
                this.hideCardOptions();
            }
        }, { passive: true });
        
        // Fermer en changeant d'onglet
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isTaskbarActive) {
                this.hideCardOptions();
            }
        });
    }
    
    showTaskbar(cardId) {
        const taskbar = document.getElementById('taskbar');
        taskbar.classList.add('active');
        
        // Stocker l'ID de la carte sélectionnée
        taskbar.dataset.cardId = cardId;
        
        // Animation d'entrée
        setTimeout(() => {
            taskbar.style.transform = 'translateY(0)';
        }, 10);
    }
    
    hideCardOptions() {
        // Marquer que la barre de tâches n'est plus active
        this.isTaskbarActive = false;
        
        // Cacher l'overlay
        const overlay = document.getElementById('overlayBlur');
        overlay.classList.remove('active');
        
        // Cacher le modal avec animation
        const modal = document.getElementById('cardModal');
        modal.classList.remove('active');
        
        // Cacher la barre de tâches avec animation
        const taskbar = document.getElementById('taskbar');
        taskbar.classList.remove('active');
        
        // Réinitialiser
        this.selectedCard = null;
        this.isLongPress = false;
        
        // Retirer les classes des cartes
        document.querySelectorAll('.affiche-card').forEach(card => {
            card.classList.remove('pressing', 'long-press');
        });
        
        console.log('❌ Options fermées');
    }
    
    handleTaskbarAction(action) {
        const taskbar = document.getElementById('taskbar');
        const cardId = taskbar.dataset.cardId;
        
        if (!cardId) return;
        
        console.log(`⚡ Action: ${action} sur carte ${cardId}`);
        
        switch (action) {
            case 'edit':
                this.editAffiche(cardId);
                break;
                
            case 'view':
                this.viewAffiche(cardId);
                break;
                
            case 'download':
                this.downloadAffiche(cardId);
                break;
                
            case 'delete':
                this.deleteAffiche(cardId);
                break;
                
            case 'share':
                this.shareAffiche(cardId);
                break;
        }
        
        // Cacher les options après action
        this.hideCardOptions();
    }
    
    editAffiche(cardId) {
        // Ouvrir l'éditeur avec l'ID de la carte
        window.location.href = `editor.html?id=${cardId}`;
    }
    
    viewAffiche(cardId) {
        // Vérifier si l'affiche a des données complètes
        if (window.megFoodLibrary) {
            const affiche = window.megFoodLibrary.getAfficheById(cardId);
            
            if (affiche) {
                if (affiche.data) {
                    // Préparer les données pour lecture.html
                    this.prepareForReading(affiche);
                    
                    // Ouvrir en mode lecture dans un nouvel onglet
                    const readerWindow = window.open('lecture.html', '_blank');
                    
                    // Stocker les données pour le nouvel onglet
                    sessionStorage.setItem('megFoodCurrentAffiche', JSON.stringify(affiche));
                    localStorage.setItem('megFoodLastViewed', affiche.id);
                    
                    this.showNotification('👁️ Ouverture de la prévisualisation...');
                    
                    // Vérifier si la fenêtre s'est ouverte
                    setTimeout(() => {
                        if (readerWindow) {
                            // Focus sur la nouvelle fenêtre
                            readerWindow.focus();
                        } else {
                            // Fallback: ouvrir dans le même onglet
                            window.location.href = 'lecture.html';
                        }
                    }, 100);
                } else {
                    // Affiche non complétée - éditer
                    this.editAffiche(cardId);
                }
            }
        } else {
            // Fallback simple
            window.open('lecture.html', '_blank');
        }
    }
    
    prepareForReading(affiche) {
        // Préparer les données pour la lecture
        const readingData = {
            id: affiche.id,
            title: affiche.title,
            date: affiche.date,
            image: affiche.image,
            data: affiche.data,
            createdAt: affiche.createdAt
        };
        
        // Stocker dans sessionStorage pour lecture.html
        sessionStorage.setItem('megFoodReadingData', JSON.stringify(readingData));
        
        // Stocker aussi dans localStorage pour persistance
        localStorage.setItem('megFoodCurrentReading', JSON.stringify(readingData));
    }
    
    downloadAffiche(cardId) {
        if (window.megFoodLibrary) {
            const affiche = window.megFoodLibrary.getAfficheById(cardId);
            
            if (affiche) {
                if (affiche.data) {
                    // Télécharger les données JSON
                    const dataStr = JSON.stringify(affiche.data, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                    
                    const link = document.createElement('a');
                    link.setAttribute('href', dataUri);
                    link.setAttribute('download', `${affiche.title.replace(/[^a-z0-9]/gi, '_')}.json`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    this.showNotification('📥 Affiche téléchargée !');
                } else {
                    this.showNotification('⚠️ Cette affiche ne contient pas encore de données.', 'warning');
                }
            }
        }
    }
    
    deleteAffiche(cardId) {
        if (window.megFoodLibrary) {
            const affiche = window.megFoodLibrary.getAfficheById(cardId);
            
            if (affiche) {
                // Demander confirmation
                if (confirm(`Supprimer "${affiche.title}" ?\nCette action est irréversible.`)) {
                    const success = window.megFoodLibrary.deleteAffiche(cardId);
                    
                    if (success) {
                        this.showNotification('🗑️ Affiche supprimée !');
                        
                        // Vibrer sur mobile
                        if (navigator.vibrate) {
                            navigator.vibrate([100, 50, 100]);
                        }
                    }
                }
            }
        }
    }
    
    shareAffiche(cardId) {
        if (window.megFoodLibrary) {
            const affiche = window.megFoodLibrary.getAfficheById(cardId);
            
            if (affiche) {
                // Préparer le texte de partage
                const shareText = `Découvrez mon affiche "${affiche.title}" créée avec Meg Food !`;
                const shareUrl = window.location.origin;
                
                if (navigator.share) {
                    // Web Share API (mobile)
                    navigator.share({
                        title: affiche.title,
                        text: shareText,
                        url: shareUrl
                    }).then(() => {
                        console.log('✅ Partage réussi');
                    }).catch((error) => {
                        console.log('❌ Partage annulé:', error);
                        this.fallbackShare(affiche);
                    });
                } else {
                    // Fallback pour desktop
                    this.fallbackShare(affiche);
                }
            }
        }
    }
    
    fallbackShare(affiche) {
        // Copier dans le presse-papier
        const shareText = `Affiche: ${affiche.title}\nDate: ${affiche.date}\n\nCréée avec Meg Food - ${window.location.origin}`;
        
        navigator.clipboard.writeText(shareText)
            .then(() => {
                this.showNotification('📋 Lien copié dans le presse-papier !');
            })
            .catch(() => {
                // Fallback ultime
                prompt('Copiez ce texte pour partager :', shareText);
            });
    }
    
    showNotification(message, type = 'success') {
        // Supprimer les notifications existantes
        document.querySelectorAll('.task-notification').forEach(n => n.remove());
        
        // Créer une notification
        const notification = document.createElement('div');
        notification.className = `task-notification task-notification-${type}`;
        
        // Icône selon le type
        let icon = '✅';
        if (type === 'warning') icon = '⚠️';
        if (type === 'error') icon = '❌';
        
        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-text">${message}</span>
        `;
        
        // Styles
        notification.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: var(--surface-color);
            color: var(--text-color);
            padding: 12px 20px;
            border-radius: 12px;
            z-index: 1001;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 
                0 4px 12px rgba(0, 0, 0, 0.2),
                0 0 0 1px rgba(255, 255, 255, 0.1);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            max-width: 300px;
            text-align: center;
        `;
        
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialiser le gestionnaire de tâches
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que la bibliothèque soit chargée
    if (window.megFoodLibrary) {
        window.taskManager = new TaskManager();
    } else {
        // Attendre que la bibliothèque soit initialisée
        const checkInterval = setInterval(() => {
            if (window.megFoodLibrary) {
                clearInterval(checkInterval);
                window.taskManager = new TaskManager();
            }
        }, 100);
    }
});