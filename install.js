let deferredPrompt;

// Écouter l'événement beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Empêcher l'affichage automatique du prompt
  e.preventDefault();
  
  // Stocker l'événement pour l'utiliser plus tard
  deferredPrompt = e;
  
  // Afficher le prompt d'installation
  afficherPromptInstallation();
});

// Fonction pour afficher le prompt d'installation
function afficherPromptInstallation() {
  // Créer un conteneur pour le prompt
  const promptContainer = document.createElement('div');
  promptContainer.id = 'install-prompt-container';
  promptContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background-color: #FFFFFF;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    max-width: 400px;
  `;
  
  promptContainer.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 15px;">
      <div>
        <h3 style="color: #000000; margin: 0 0 10px 0; font-size: 18px;">Installer l'app</h3>
        <p style="color: #666666; margin: 0; font-size: 14px;">Installer la Calculatrice sur votre téléphone pour un accès rapide!</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="install-btn" style="
          flex: 1;
          background-color: #00AA00;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 4px 4px 8px rgba(200, 200, 200, 0.4);
        ">Installer</button>
        <button id="dismiss-btn" style="
          flex: 1;
          background-color: #F0F0F0;
          color: #000000;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 4px 4px 8px rgba(200, 200, 200, 0.4);
        ">Plus tard</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(promptContainer);
  
  // Événement du bouton Installer
  document.getElementById('install-btn').addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Utilisateur a accepté l\'installation');
        } else {
          console.log('Utilisateur a refusé l\'installation');
        }
        deferredPrompt = null;
        promptContainer.remove();
      });
    }
  });
  
  // Événement du bouton Plus tard
  document.getElementById('dismiss-btn').addEventListener('click', () => {
    promptContainer.remove();
  });
}

// Écouter l'événement appinstalled
window.addEventListener('appinstalled', () => {
  console.log('PWA installée avec succès!');
  deferredPrompt = null;
});

// Écouter si l'app est déjà installée
window.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App est déjà installée');
  }
});
