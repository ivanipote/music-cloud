// modif.js - Version simplifiée finale
class MegFoodApplier {
    constructor() {
        this.currentData = null;
        this.init();
    }
    
    init() {
        this.loadAndApply();
        this.setupTouchEvents();
    }
    
    loadAndApply() {
        try {
            // Charger depuis sessionStorage (live) ou localStorage
            const liveData = sessionStorage.getItem('megFoodLiveData');
            const savedData = localStorage.getItem('megFoodAffiche');
            
            if (liveData) {
                this.currentData = JSON.parse(liveData);
            } else if (savedData) {
                this.currentData = JSON.parse(savedData);
            }
            
            if (this.currentData) {
                this.applyAllModifications();
            }
        } catch (error) {
            console.error('Erreur de chargement:', error);
        }
    }
    
    applyAllModifications() {
        if (!this.currentData) return;
        
        this.applyHeader();
        this.applyProducts();
        this.applyContacts();
        this.applyDescription();
    }
    
    applyHeader() {
        const logo = document.querySelector('.logo');
        const title = document.querySelector('.site-title');
        const promo = document.querySelector('.promo-text');
        
        if (logo && this.currentData.logoEmoji) logo.textContent = this.currentData.logoEmoji;
        if (title && this.currentData.siteTitle) title.textContent = this.currentData.siteTitle;
        if (promo && this.currentData.promoText) promo.textContent = this.currentData.promoText;
    }
    
    applyProducts() {
        for (let i = 1; i <= 3; i++) {
            const label = document.querySelectorAll('.image-label')[i-1];
            const img = document.querySelectorAll('.square-image')[i-1];
            
            if (label && this.currentData[`product${i}Label`]) {
                label.textContent = this.currentData[`product${i}Label`];
            }
            
            if (img && this.currentData[`product${i}Image`]) {
                const tempImg = new Image();
                tempImg.onload = () => img.src = this.currentData[`product${i}Image`];
                tempImg.onerror = () => img.src = this.getDefaultImage(i);
                tempImg.src = this.currentData[`product${i}Image`];
            }
        }
    }
    
    getDefaultImage(num) {
        const defaults = {
            1: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            2: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            3: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        };
        return defaults[num] || defaults[1];
    }
    
    applyContacts() {
        const contactsTitle = document.querySelector('.contacts-title');
        if (contactsTitle && this.currentData.contactsTitle) {
            contactsTitle.textContent = this.currentData.contactsTitle;
        }
        
        this.updateContactLinks();
    }
    
    updateContactLinks() {
        // WhatsApp
        const whatsappLinks = document.querySelectorAll('a[href*="whatsapp"]');
        if (whatsappLinks.length > 0 && this.currentData.whatsappNumber) {
            const cleanNumber = this.currentData.whatsappNumber.replace(/\D/g, '');
            whatsappLinks.forEach(link => {
                link.href = `https://wa.me/${cleanNumber}`;
                const text = link.querySelector('.contact-text');
                if (text) text.textContent = `WhatsApp: ${this.currentData.whatsappNumber}`;
            });
        }
        
        // Téléphone
        const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
        if (phoneLinks.length > 0 && this.currentData.phoneNumber) {
            const cleanNumber = this.currentData.phoneNumber.replace(/\D/g, '');
            phoneLinks.forEach(link => {
                link.href = `tel:${cleanNumber}`;
                const text = link.querySelector('.contact-text');
                if (text) text.textContent = `Appeler: ${this.currentData.phoneNumber}`;
            });
        }
        
        // Email
        const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
        if (emailLinks.length > 0 && this.currentData.emailAddress) {
            emailLinks.forEach(link => {
                link.href = `mailto:${this.currentData.emailAddress}`;
                const text = link.querySelector('.contact-text');
                if (text) text.textContent = this.currentData.emailAddress;
            });
        }
    }
    
    applyDescription() {
        const descTitle = document.querySelector('.description-title');
        const descText = document.querySelector('.description-text');
        
        if (descTitle && this.currentData.descriptionTitle) {
            descTitle.textContent = this.currentData.descriptionTitle;
        }
        
        if (descText && this.currentData.descriptionText) {
            descText.textContent = this.currentData.descriptionText;
        }
    }
    
    setupTouchEvents() {
        const title = document.querySelector('.site-title');
        if (!title) return;
        
        let tapTimer;
        let isLongPress = false;
        
        title.addEventListener('click', () => {
            if (!isLongPress) {
                setTimeout(() => {
                    if (!isLongPress) window.location.href = 'editor.html';
                }, 50);
            }
            isLongPress = false;
        });
        
        title.addEventListener('touchstart', () => {
            isLongPress = false;
            tapTimer = setTimeout(() => {
                isLongPress = true;
                this.saveAndReturnHome();
            }, 800);
        });
        
        title.addEventListener('touchend', () => clearTimeout(tapTimer));
        title.addEventListener('touchmove', () => clearTimeout(tapTimer));
        title.addEventListener('dblclick', () => this.saveAndReturnHome());
        
        title.style.cursor = 'pointer';
    }
    
    saveAndReturnHome() {
        if (this.currentData) {
            this.createThumbnail();
            setTimeout(() => window.location.href = 'index.html', 500);
        } else {
            window.location.href = 'index.html';
        }
    }
    
    createThumbnail() {
        if (!this.currentData) return;
        
        const thumbnailData = {
            id: Date.now(),
            title: this.currentData.siteTitle || 'Meg Food',
            shortTitle: (this.currentData.siteTitle || 'Meg Food').substring(0, 15) + '...',
            image: this.currentData.product1Image || this.getDefaultImage(1),
            date: new Date().toLocaleDateString('fr-FR'),
            data: { ...this.currentData }
        };
        
        const affiches = JSON.parse(localStorage.getItem('megFoodAffiches') || '[]');
        affiches.unshift(thumbnailData);
        localStorage.setItem('megFoodAffiches', JSON.stringify(affiches.slice(0, 20)));
    }
}

// Initialiser
document.addEventListener('DOMContentLoaded', () => {
    window.megFoodApplier = new MegFoodApplier();
});