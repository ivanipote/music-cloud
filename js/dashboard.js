import { supabase } from './supabase.js'

// Variables globales
let currentUser = null
let currentPlaylist = []
let currentMusicIndex = -1
let isPlaying = false
let isUploading = false
let currentUploadController = null

// Éléments DOM
const elements = {
    loading: document.getElementById('loading'),
    menuToggle: document.getElementById('menuToggle'),
    sidebar: document.getElementById('sidebar'),
    uploadBtn: document.getElementById('uploadBtn'),
    fileInput: document.getElementById('fileInput'),
    uploadProgress: document.getElementById('uploadProgress'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    progressPercent: document.getElementById('progressPercent'),
    cancelUpload: document.getElementById('cancelUpload'),
    userBtn: document.getElementById('userBtn'),
    username: document.getElementById('username'),
    logoutBtn: document.getElementById('logoutBtn'),
    musicGrid: document.getElementById('musicGrid'),
    musicCount: document.getElementById('musicCount'),
    emptyLibrary: document.getElementById('emptyLibrary'),
    searchInput: document.getElementById('searchInput'),
    navItems: document.querySelectorAll('.nav-item[data-section]'),
    contentSections: document.querySelectorAll('.content-section'),
    
    // Player elements
    audioPlayer: document.getElementById('audioPlayer'),
    trackTitle: document.getElementById('trackTitle'),
    trackArtist: document.getElementById('trackArtist'),
    btnPlay: document.getElementById('btnPlay'),
    btnPrev: document.getElementById('btnPrev'),
    btnNext: document.getElementById('btnNext'),
    timeCurrent: document.getElementById('timeCurrent'),
    timeTotal: document.getElementById('timeTotal'),
    playerProgress: document.getElementById('playerProgress'),
    progressContainer: document.getElementById('progressContainer'),
    volumeSlider: document.getElementById('volumeSlider'),
    btnVolume: document.getElementById('btnVolume'),
    notifications: document.getElementById('notifications'),
    
    // Storage info
    storagePercent: document.getElementById('storagePercent'),
    storageFill: document.getElementById('storageFill'),
    storageUsed: document.getElementById('storageUsed'),
    
    // Theme toggle
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeCheckbox: document.getElementById('themeCheckbox')
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎵 Dashboard - Initialisation')
    
    try {
        showLoading(true)
        
        // 1. Vérifier l'authentification
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
            window.location.href = 'index.html'
            return
        }
        
        currentUser = session.user
        console.log('👤 Connecté:', currentUser.email)
        
        // 2. Mettre à jour l'interface utilisateur
        updateUserInterface()
        
        // 3. Charger la bibliothèque
        await loadLibrary()
        
        // 4. Charger les informations de stockage
        await updateStorageInfo()
        
        // 5. Configurer les événements
        setupEventListeners()
        
        // 6. Initialiser le player
        initAudioPlayer()
        
        // 7. Vérifier le thème
        initTheme()
        
        console.log('✅ Dashboard prêt !')
        
    } catch (error) {
        console.error('💥 Erreur initialisation:', error)
        showNotification('Erreur d\'initialisation: ' + error.message, 'error')
    } finally {
        showLoading(false)
    }
})

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function showLoading(show) {
    if (elements.loading) {
        if (show) {
            elements.loading.classList.add('active')
        } else {
            elements.loading.classList.remove('active')
        }
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    }
    
    notification.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <div class="notification-content">${message}</div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `
    
    elements.notifications.appendChild(notification)
    
    // Fermer au clic
    const closeBtn = notification.querySelector('.notification-close')
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease'
        setTimeout(() => {
            notification.remove()
        }, 300)
    })
    
    // Auto-remove après 5 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease'
            setTimeout(() => {
                notification.remove()
            }, 300)
        }
    }, 5000)
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// ============================================
// INTERFACE UTILISATEUR
// ============================================

function updateUserInterface() {
    // Mettre à jour le nom d'utilisateur
    if (elements.username && currentUser) {
        const email = currentUser.email
        const username = currentUser.user_metadata?.username || email.split('@')[0]
        elements.username.textContent = username
        
        // Mettre à jour l'avatar avec les initiales
        const avatar = elements.userBtn?.querySelector('.user-avatar')
        if (avatar) {
            const initials = username.charAt(0).toUpperCase()
            avatar.innerHTML = `<span>${initials}</span>`
        }
    }
}

async function updateStorageInfo() {
    try {
        // Récupérer la taille totale des musiques de l'utilisateur
        const { data: musics, error } = await supabase
            .from('musics')
            .select('file_size')
            .eq('user_id', currentUser.id)
        
        if (error) throw error
        
        // Calculer la taille totale
        const totalSize = musics?.reduce((sum, music) => sum + (music.file_size || 0), 0) || 0
        const maxSize = 1 * 1024 * 1024 * 1024 // 1 GB
        
        // Calculer le pourcentage
        const percent = Math.min((totalSize / maxSize) * 100, 100)
        
        // Mettre à jour l'interface
        if (elements.storagePercent) {
            elements.storagePercent.textContent = `${Math.round(percent)}%`
        }
        
        if (elements.storageFill) {
            elements.storageFill.style.width = `${percent}%`
        }
        
        if (elements.storageUsed) {
            elements.storageUsed.textContent = formatFileSize(totalSize)
        }
        
    } catch (error) {
        console.error('Erreur mise à jour stockage:', error)
    }
}

// ============================================
// NAVIGATION & THÈME
// ============================================

function setupNavigation() {
    // Navigation sidebar
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault()
            
            // Retirer la classe active de tous les items
            elements.navItems.forEach(navItem => navItem.classList.remove('active'))
            
            // Ajouter la classe active à l'item cliqué
            item.classList.add('active')
            
            // Afficher la section correspondante
            const section = item.dataset.section
            showSection(section)
            
            // Fermer le sidebar sur mobile
            if (window.innerWidth < 992) {
                elements.sidebar.classList.remove('show')
            }
        })
    })
    
    // Menu toggle mobile
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', () => {
            elements.sidebar.classList.toggle('show')
        })
    }
    
    // Recherche
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', debounce(handleSearch, 300))
    }
}

function showSection(sectionId) {
    // Cacher toutes les sections
    elements.contentSections.forEach(section => {
        section.classList.remove('active')
    })
    
    // Afficher la section demandée
    const targetSection = document.getElementById(`${sectionId}Section`)
    if (targetSection) {
        targetSection.classList.add('active')
    }
}

function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

async function handleSearch() {
    const searchTerm = elements.searchInput.value.trim().toLowerCase()
    
    if (!searchTerm) {
        // Recharger toute la bibliothèque
        await loadLibrary()
        return
    }
    
    try {
        // Recherche dans la base de données
        const { data: musics, error } = await supabase
            .from('musics')
            .select('*')
            .eq('user_id', currentUser.id)
            .or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false })
        
        if (error) throw error
        
        // Mettre à jour l'affichage
        displayMusics(musics || [])
        
    } catch (error) {
        console.error('Erreur recherche:', error)
        showNotification('Erreur lors de la recherche', 'error')
    }
}

function initTheme() {
    // Vérifier le thème sauvegardé
    const savedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
    
    // Mettre à jour le checkbox
    if (elements.themeCheckbox) {
        elements.themeCheckbox.checked = savedTheme === 'dark'
    }
    
    // Gérer le toggle
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.addEventListener('click', (e) => {
            e.preventDefault()
            toggleTheme()
        })
    }
    
    if (elements.themeCheckbox) {
        elements.themeCheckbox.addEventListener('change', toggleTheme)
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    
    // Changer le thème
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Mettre à jour le checkbox
    if (elements.themeCheckbox) {
        elements.themeCheckbox.checked = newTheme === 'dark'
    }
    
    showNotification(`Thème ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`)
}

// ============================================
// BIBLIOTHÈQUE MUSICALE
// ============================================

async function loadLibrary() {
    console.log('📚 Chargement bibliothèque...')
    
    try {
        const { data: musics, error } = await supabase
            .from('musics')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
        
        if (error) throw error
        
        // Mettre à jour la playlist globale
        currentPlaylist = musics || []
        
        // Afficher les musiques
        displayMusics(currentPlaylist)
        
        console.log(`✅ ${currentPlaylist.length} musique(s) chargée(s)`)
        
    } catch (error) {
        console.error('❌ Erreur chargement bibliothèque:', error)
        showNotification('Erreur de chargement de la bibliothèque', 'error')
        
        // Afficher l'état vide
        displayMusics([])
    }
}

function displayMusics(musics) {
    // Mettre à jour le compteur
    if (elements.musicCount) {
        elements.musicCount.textContent = `${musics.length} musique${musics.length !== 1 ? 's' : ''}`
    }
    
    // Vider la grille
    if (elements.musicGrid) {
        elements.musicGrid.innerHTML = ''
    }
    
    // Afficher l'état vide si nécessaire
    if (!musics || musics.length === 0) {
        if (elements.emptyLibrary) {
            elements.emptyLibrary.style.display = 'flex'
        }
        return
    }
    
    // Cacher l'état vide
    if (elements.emptyLibrary) {
        elements.emptyLibrary.style.display = 'none'
    }
    
    // Créer les cartes de musique
    musics.forEach((music, index) => {
        const card = createMusicCard(music, index)
        if (elements.musicGrid) {
            elements.musicGrid.appendChild(card)
        }
    })
}

function createMusicCard(music, index) {
    const card = document.createElement('div')
    card.className = 'music-card'
    card.dataset.index = index
    
    const duration = music.duration ? formatTime(music.duration) : '--:--'
    const fileSize = music.file_size ? formatFileSize(music.file_size) : ''
    
    card.innerHTML = `
        <div class="music-cover">
            <i class="fas fa-music"></i>
        </div>
        <div class="music-info">
            <div class="music-title" title="${music.title}">${music.title}</div>
            <div class="music-artist">${music.artist || 'Artiste inconnu'}</div>
            <div class="music-meta">
                <span class="music-duration">${duration}</span>
                ${fileSize ? `<span class="music-size">${fileSize}</span>` : ''}
            </div>
        </div>
    `
    
    // Événements
    card.addEventListener('click', () => {
        selectAndPlayMusic(index)
    })
    
    card.addEventListener('mouseenter', () => {
        card.classList.add('hover')
    })
    
    card.addEventListener('mouseleave', () => {
        card.classList.remove('hover')
    })
    
    return card
}

// ============================================
// GESTION DE LA LECTURE
// ============================================

function selectAndPlayMusic(index) {
    console.log('🎯 Sélection musique:', index)
    
    if (!currentPlaylist[index]) {
        console.error('❌ Musique non trouvée à l\'index:', index)
        return
    }
    
    const music = currentPlaylist[index]
    currentMusicIndex = index
    
    // Mettre en surbrillance la carte sélectionnée
    document.querySelectorAll('.music-card').forEach(card => {
        card.classList.remove('playing')
    })
    
    const selectedCard = document.querySelector(`.music-card[data-index="${index}"]`)
    if (selectedCard) {
        selectedCard.classList.add('playing')
    }
    
    // Mettre à jour l'affichage du player
    updatePlayerDisplay(music)
    
    // Jouer la musique
    playMusic(music)
}

function updatePlayerDisplay(music) {
    if (elements.trackTitle) {
        elements.trackTitle.textContent = music.title
    }
    
    if (elements.trackArtist) {
        elements.trackArtist.textContent = music.artist || 'Artiste inconnu'
    }
    
    if (elements.timeTotal && music.duration) {
        elements.timeTotal.textContent = formatTime(music.duration)
    }
}

async function playMusic(music) {
    console.log('▶️ Lecture:', music.title)
    
    try {
        // Obtenir l'URL de la musique
        const audioUrl = await getMusicUrl(music.file_path)
        
        if (!audioUrl) {
            throw new Error('Impossible d\'obtenir l\'URL de la musique')
        }
        
        console.log('🔗 URL audio:', audioUrl)
        
        // Configurer le lecteur audio
        const audioPlayer = elements.audioPlayer
        
        // Vérifier si c'est la même musique déjà chargée
        if (audioPlayer.src !== audioUrl) {
            audioPlayer.src = audioUrl
            audioPlayer.load()
        }
        
        // Démarrer la lecture
        await audioPlayer.play()
        
        // Mettre à jour l'état
        isPlaying = true
        updatePlayButton()
        
        console.log('✅ Lecture démarrée')
        
    } catch (error) {
        console.error('❌ Erreur lecture:', error)
        
        let userMessage = 'Impossible de lire la musique'
        
        if (error.name === 'NotAllowedError') {
            userMessage = 'Le navigateur bloque la lecture automatique. Cliquez sur le bouton play.'
        } else if (error.name === 'NotSupportedError') {
            userMessage = 'Format audio non supporté.'
        } else if (error.message.includes('network')) {
            userMessage = 'Erreur réseau. Vérifiez votre connexion.'
        }
        
        showNotification(userMessage, 'error')
        
        isPlaying = false
        updatePlayButton()
    }
}

async function getMusicUrl(filePath) {
    console.log('🔗 Génération URL pour:', filePath)
    
    try {
        // Essayer d'abord l'URL signée
        const { data: signedData, error: signedError } = await supabase.storage
            .from('musics')
            .createSignedUrl(filePath, 3600)
        
        if (!signedError && signedData?.signedUrl) {
            console.log('✅ URL signée générée')
            return signedData.signedUrl
        }
        
        console.log('⚠️ URL signée échouée, utilisation URL publique')
        
        // Fallback: URL publique
        const { data: publicData } = supabase.storage
            .from('musics')
            .getPublicUrl(filePath)
        
        return publicData.publicUrl
        
    } catch (error) {
        console.error('❌ Erreur génération URL:', error)
        throw error
    }
}

function initAudioPlayer() {
    const audioPlayer = elements.audioPlayer
    
    if (!audioPlayer) {
        console.error('❌ Lecteur audio non trouvé')
        return
    }
    
    // Configuration
    audioPlayer.preload = 'none'
    audioPlayer.crossOrigin = 'anonymous'
    
    // Volume initial
    audioPlayer.volume = elements.volumeSlider ? elements.volumeSlider.value / 100 : 0.8
    
    // Événements
    audioPlayer.addEventListener('loadeddata', () => {
        console.log('✅ Audio chargé, durée:', formatTime(audioPlayer.duration))
        if (elements.timeTotal) {
            elements.timeTotal.textContent = formatTime(audioPlayer.duration)
        }
    })
    
    audioPlayer.addEventListener('timeupdate', updateAudioProgress)
    
    audioPlayer.addEventListener('play', () => {
        isPlaying = true
        updatePlayButton()
        console.log('▶️ Lecture démarrée')
    })
    
    audioPlayer.addEventListener('pause', () => {
        isPlaying = false
        updatePlayButton()
        console.log('⏸️ Lecture en pause')
    })
    
    audioPlayer.addEventListener('ended', () => {
        console.log('⏹️ Lecture terminée')
        playNext()
    })
    
    audioPlayer.addEventListener('error', (e) => {
        console.error('❌ Erreur lecteur audio:', audioPlayer.error)
        
        switch(audioPlayer.error?.code) {
            case MediaError.MEDIA_ERR_NETWORK:
                showNotification('Erreur réseau', 'error')
                break
            case MediaError.MEDIA_ERR_DECODE:
                showNotification('Format audio non supporté', 'error')
                break
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                showNotification('Format MP3 non supporté', 'error')
                break
            default:
                showNotification('Erreur de lecture audio', 'error')
        }
    })
    
    console.log('✅ Lecteur audio initialisé')
}

function updateAudioProgress() {
    const audioPlayer = elements.audioPlayer
    
    if (!audioPlayer || !audioPlayer.duration) return
    
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100
    
    // Mettre à jour la barre de progression
    if (elements.playerProgress) {
        elements.playerProgress.style.width = `${progress}%`
    }
    
    // Mettre à jour le temps affiché
    if (elements.timeCurrent) {
        elements.timeCurrent.textContent = formatTime(audioPlayer.currentTime)
    }
}

function updatePlayButton() {
    const playIcon = elements.btnPlay?.querySelector('i')
    
    if (!playIcon) return
    
    if (isPlaying) {
        playIcon.className = 'fas fa-pause'
        elements.btnPlay.title = 'Pause'
    } else {
        playIcon.className = 'fas fa-play'
        elements.btnPlay.title = 'Lecture'
    }
}

function playNext() {
    if (currentPlaylist.length === 0) return
    
    const nextIndex = (currentMusicIndex + 1) % currentPlaylist.length
    selectAndPlayMusic(nextIndex)
}

function playPrev() {
    if (currentPlaylist.length === 0) return
    
    const prevIndex = (currentMusicIndex - 1 + currentPlaylist.length) % currentPlaylist.length
    selectAndPlayMusic(prevIndex)
}

// ============================================
// UPLOAD DE MUSIQUES
// ============================================

function setupUploadEvents() {
    // Bouton upload
    if (elements.uploadBtn) {
        elements.uploadBtn.addEventListener('click', () => {
            elements.fileInput.click()
        })
    }
    
    // Sélection de fichiers
    if (elements.fileInput) {
        elements.fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files)
            if (files.length > 0) {
                await handleFileUpload(files[0])
            }
            elements.fileInput.value = ''
        })
    }
    
    // Annulation upload
    if (elements.cancelUpload) {
        elements.cancelUpload.addEventListener('click', cancelUpload)
    }
    
    // Drag & drop
    document.addEventListener('dragover', (e) => {
        e.preventDefault()
        if (!isUploading) {
            document.body.classList.add('drag-over')
        }
    })
    
    document.addEventListener('dragleave', () => {
        document.body.classList.remove('drag-over')
    })
    
    document.addEventListener('drop', async (e) => {
        e.preventDefault()
        document.body.classList.remove('drag-over')
        
        if (isUploading) return
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.name.toLowerCase().endsWith('.mp3')
        )
        
        if (files.length > 0) {
            await handleFileUpload(files[0])
        }
    })
}

async function handleFileUpload(file) {
    if (isUploading) {
        showNotification('Un upload est déjà en cours', 'warning')
        return
    }
    
    // Validation
    if (!file.name.toLowerCase().endsWith('.mp3')) {
        showNotification('Seuls les fichiers MP3 sont acceptés', 'error')
        return
    }
    
    if (file.size > 50 * 1024 * 1024) {
        showNotification('Fichier trop volumineux (max 50MB)', 'error')
        return
    }
    
    // Préparer l'upload
    const fileId = crypto.randomUUID()
    const fileName = `${fileId}.mp3`
    const filePath = `${currentUser.id}/${fileName}`
    
    isUploading = true
    currentUploadController = new AbortController()
    
    try {
        // Afficher la progression
        showUploadProgress(file.name)
        
        // 1. Upload vers Storage
        updateUploadProgress(10, 'Upload vers le cloud...')
        
        const { error: uploadError } = await supabase.storage
            .from('musics')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                signal: currentUploadController.signal
            })
        
        if (uploadError) {
            if (uploadError.message.includes('abort')) {
                throw new Error('Upload annulé')
            }
            throw new Error(`Upload échoué: ${uploadError.message}`)
        }
        
        updateUploadProgress(60, 'Extraction des métadonnées...')
        
        // 2. Calculer la durée
        const duration = await getAudioDuration(file)
        
        // 3. Extraire le titre
        const title = file.name.replace(/\.mp3$/i, '').trim() || 'Sans titre'
        
        // 4. Sauvegarder métadonnées
        updateUploadProgress(80, 'Sauvegarde des informations...')
        
        const { error: dbError } = await supabase
            .from('musics')
            .insert([{
                user_id: currentUser.id,
                title: title,
                artist: 'Artiste inconnu',
                file_name: fileName,
                file_path: filePath,
                file_size: file.size,
                duration: duration,
                created_at: new Date().toISOString()
            }])
        
        if (dbError) throw new Error(`Sauvegarde échouée: ${dbError.message}`)
        
        // Succès
        updateUploadProgress(100, '✅ Upload réussi !')
        
        // Mettre à jour l'interface
        setTimeout(async () => {
            hideUploadProgress()
            await loadLibrary()
            await updateStorageInfo()
            showNotification('Musique ajoutée avec succès !', 'success')
        }, 1500)
        
    } catch (error) {
        console.error('💥 Erreur upload:', error)
        
        // Nettoyer en cas d'erreur après l'upload
        if (!error.message.includes('annulé')) {
            try {
                await supabase.storage
                    .from('musics')
                    .remove([filePath])
            } catch (cleanupError) {
                console.error('⚠️ Erreur nettoyage:', cleanupError)
            }
        }
        
        updateUploadProgress(0, `❌ ${error.message}`)
        
        setTimeout(() => {
            hideUploadProgress()
            showNotification(error.message, 'error')
        }, 3000)
        
    } finally {
        isUploading = false
        currentUploadController = null
    }
}

function cancelUpload() {
    if (currentUploadController && isUploading) {
        currentUploadController.abort()
        hideUploadProgress()
        showNotification('Upload annulé', 'warning')
    }
}

function getAudioDuration(file) {
    return new Promise((resolve) => {
        const audio = new Audio()
        audio.preload = 'metadata'
        
        audio.onloadedmetadata = () => {
            window.URL.revokeObjectURL(audio.src)
            resolve(Math.round(audio.duration))
        }
        
        audio.onerror = () => resolve(0)
        audio.src = URL.createObjectURL(file)
    })
}

function showUploadProgress(filename) {
    if (elements.uploadProgress) {
        elements.uploadProgress.classList.add('show')
        elements.uploadProgress.style.display = 'block'
    }
    
    if (elements.progressText) {
        elements.progressText.textContent = `Préparation: ${filename}`
    }
    
    if (elements.progressFill) {
        elements.progressFill.style.width = '0%'
    }
    
    if (elements.progressPercent) {
        elements.progressPercent.textContent = '0%'
    }
}

function updateUploadProgress(percent, message = '') {
    if (elements.progressFill) {
        elements.progressFill.style.width = `${percent}%`
    }
    
    if (elements.progressPercent) {
        elements.progressPercent.textContent = `${percent}%`
    }
    
    if (elements.progressText && message) {
        elements.progressText.textContent = message
    }
}

function hideUploadProgress() {
    if (elements.uploadProgress) {
        elements.uploadProgress.classList.remove('show')
        setTimeout(() => {
            elements.uploadProgress.style.display = 'none'
        }, 300)
    }
}

// ============================================
// CONTRÔLES DU PLAYER
// ============================================

function setupPlayerControls() {
    // Play/Pause
    if (elements.btnPlay) {
        elements.btnPlay.addEventListener('click', () => {
            const audioPlayer = elements.audioPlayer
            
            if (!audioPlayer.src) {
                if (currentPlaylist.length > 0) {
                    selectAndPlayMusic(0)
                }
                return
            }
            
            if (audioPlayer.paused) {
                audioPlayer.play().catch(error => {
                    console.error('❌ Erreur play:', error)
                    showNotification('Cliquez sur une musique puis réessayez', 'warning')
                })
            } else {
                audioPlayer.pause()
            }
        })
    }
    
    // Précédent/Suivant
    if (elements.btnPrev) {
        elements.btnPrev.addEventListener('click', playPrev)
    }
    
    if (elements.btnNext) {
        elements.btnNext.addEventListener('click', playNext)
    }
    
    // Progression
    if (elements.progressContainer) {
        elements.progressContainer.addEventListener('click', (e) => {
            const audioPlayer = elements.audioPlayer
            if (!audioPlayer.duration) return
            
            const rect = elements.progressContainer.getBoundingClientRect()
            const percent = (e.clientX - rect.left) / rect.width
            audioPlayer.currentTime = percent * audioPlayer.duration
        })
    }
    
    // Volume
    if (elements.volumeSlider) {
        elements.volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100
            elements.audioPlayer.volume = volume
            
            // Mettre à jour l'icône
            const volumeIcon = elements.btnVolume?.querySelector('i')
            if (volumeIcon) {
                if (volume === 0) {
                    volumeIcon.className = 'fas fa-volume-mute'
                } else if (volume < 0.5) {
                    volumeIcon.className = 'fas fa-volume-down'
                } else {
                    volumeIcon.className = 'fas fa-volume-up'
                }
            }
        })
    }
    
    // Mute
    if (elements.btnVolume) {
        elements.btnVolume.addEventListener('click', () => {
            const audioPlayer = elements.audioPlayer
            if (audioPlayer.volume > 0) {
                audioPlayer.dataset.lastVolume = audioPlayer.volume
                audioPlayer.volume = 0
                elements.volumeSlider.value = 0
            } else {
                const lastVolume = parseFloat(audioPlayer.dataset.lastVolume) || 0.8
                audioPlayer.volume = lastVolume
                elements.volumeSlider.value = lastVolume * 100
            }
            elements.volumeSlider.dispatchEvent(new Event('input'))
        })
    }
}

// ============================================
// GESTION DE LA DÉCONNEXION
// ============================================

function setupLogout() {
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault()
            
            const confirmLogout = confirm('Voulez-vous vraiment vous déconnecter ?')
            if (!confirmLogout) return
            
            try {
                showLoading(true)
                await supabase.auth.signOut()
                window.location.href = 'index.html'
            } catch (error) {
                console.error('Erreur déconnexion:', error)
                showNotification('Erreur lors de la déconnexion', 'error')
                showLoading(false)
            }
        })
    }
}

// ============================================
// CONFIGURATION GÉNÉRALE
// ============================================

function setupEventListeners() {
    console.log('🔌 Configuration événements...')
    
    // Navigation
    setupNavigation()
    
    // Upload
    setupUploadEvents()
    
    // Player controls
    setupPlayerControls()
    
    // Déconnexion
    setupLogout()
    
    // Fermer le sidebar en cliquant à l'extérieur sur mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 992 && 
            elements.sidebar.classList.contains('show') &&
            !elements.sidebar.contains(e.target) &&
            !elements.menuToggle.contains(e.target)) {
            elements.sidebar.classList.remove('show')
        }
    })
    
    // Touche Échap pour fermer le sidebar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.sidebar.classList.contains('show')) {
            elements.sidebar.classList.remove('show')
        }
    })
    
    console.log('✅ Événements configurés')
}

// ============================================
// EXPORT (pour debugging)
// ============================================

window.cloudMusic = {
    supabase,
    currentUser,
    currentPlaylist,
    currentMusicIndex,
    isPlaying,
    loadLibrary,
    playMusic,
    showNotification
}

console.log('🎵 Dashboard module chargé')