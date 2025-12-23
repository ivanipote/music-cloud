import { supabase } from './supabase.js'

// Variables globales
let currentUser = null
let currentPlaylist = []
let currentMusicIndex = -1
let isPlaying = false
let viewMode = 'list'
let longPressTimer = null
let searchResults = []

// Raccourcir texte
function shortenText(text, maxLength = 20) {
    if (!text) return ''
    if (text.length <= maxLength) return text
    const lastSpace = text.lastIndexOf(' ', maxLength - 3)
    if (lastSpace > maxLength * 0.6) {
        return text.substring(0, lastSpace) + '...'
    }
    return text.substring(0, maxLength - 3) + '...'
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 Cloud Music Mobile')
    const loading = document.getElementById('mobileLoading')
    if (loading) loading.style.display = 'none'
    await checkSession()
    initInterface()
    setupEventListeners()
    console.log('✅ Prêt')
})

// Vérifier session
async function checkSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            currentUser = session.user
            updateUserInterface()
            await loadLibrary()
            await updateStorageInfo()
            showNotification('Connecté', 'success')
        } else {
            currentUser = null
            showVisitorMode()
        }
    } catch (error) {
        console.error('Erreur session:', error)
        currentUser = null
        showVisitorMode()
    }
}

// Mode visiteur
function showVisitorMode() {
    const emptyLibrary = document.getElementById('mobileEmptyLibrary')
    const emptyGrid = document.getElementById('mobileEmptyGrid')
    if (emptyLibrary) {
        emptyLibrary.innerHTML = `
            <i class="fas fa-user-lock"></i>
            <h3>Non connecté</h3>
            <p>Connectez-vous pour accéder à votre musique</p>
            <button class="login-btn" onclick="window.location.href='index.html'">
                <i class="fas fa-sign-in-alt"></i> Se connecter
            </button>
        `
        emptyLibrary.style.display = 'flex'
    }
    if (emptyGrid) {
        emptyGrid.innerHTML = `
            <i class="fas fa-user-lock"></i>
            <h3>Non connecté</h3>
            <p>Connectez-vous pour accéder à votre musique</p>
        `
        emptyGrid.style.display = 'flex'
    }
}

// Mettre à jour interface utilisateur
function updateUserInterface() {
    if (!currentUser) return
    const usernameEl = document.getElementById('mobileUsername')
    const userEmailEl = document.getElementById('mobileUserEmail')
    if (usernameEl) {
        const username = currentUser.user_metadata?.username || currentUser.email.split('@')[0]
        usernameEl.textContent = shortenText(username, 15)
    }
    if (userEmailEl) {
        userEmailEl.textContent = shortenText(currentUser.email, 20)
    }
}

// Initialiser interface
function initInterface() {
    const savedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
    const themeToggle = document.getElementById('mobileThemeToggle')
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark'
        themeToggle.addEventListener('change', toggleTheme)
    }
    viewMode = localStorage.getItem('viewMode') || 'list'
    updateViewModeUI()
    initAudioPlayer()
}

// Changer thème
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
    showNotification(`Thème ${newTheme === 'dark' ? 'sombre' : 'clair'}`, 'success')
}

// Mettre à jour vue
function updateViewModeUI() {
    const viewToggle = document.getElementById('viewToggle')
    const listView = document.getElementById('musicListView')
    const gridView = document.getElementById('musicGridView')
    if (!viewToggle || !listView || !gridView) return
    if (viewMode === 'list') {
        viewToggle.innerHTML = '<i class="fas fa-th"></i>'
        listView.style.display = 'block'
        gridView.style.display = 'none'
    } else {
        viewToggle.innerHTML = '<i class="fas fa-list"></i>'
        listView.style.display = 'none'
        gridView.style.display = 'block'
    }
    localStorage.setItem('viewMode', viewMode)
}

// Charger bibliothèque
async function loadLibrary() {
    if (!currentUser) return
    showLoadingBar()
    try {
        const { data: musics, error } = await supabase
            .from('musics')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
        if (error) throw error
        currentPlaylist = musics || []
        displayMusics(currentPlaylist)
        searchResults = []
        checkViewToggleVisibility()
    } catch (error) {
        console.error('Erreur chargement:', error)
        displayMusics([])
        showNotification('Erreur de chargement', 'error')
    } finally {
        hideLoadingBar()
    }
}

// Mettre à jour stockage
async function updateStorageInfo() {
    if (!currentUser) return
    try {
        const { data: musics } = await supabase
            .from('musics')
            .select('file_size')
            .eq('user_id', currentUser.id)
        const totalSize = musics?.reduce((sum, m) => sum + (m.file_size || 0), 0) || 0
        const percent = Math.min((totalSize / (1024 * 1024 * 1024)) * 100, 100)
        const storagePercent = document.getElementById('mobileStoragePercent')
        const storageFill = document.getElementById('mobileStorageFill')
        const storageUsed = document.getElementById('mobileStorageUsed')
        if (storagePercent) storagePercent.textContent = `${Math.round(percent)}%`
        if (storageFill) storageFill.style.width = `${percent}%`
        if (storageUsed) {
            const mb = totalSize / (1024 * 1024)
            storageUsed.textContent = mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(2)} GB`
        }
    } catch (error) {
        console.error('Erreur stockage:', error)
    }
}

// Afficher musiques
function displayMusics(musics) {
    const isEmpty = !musics || musics.length === 0
    const emptyLibrary = document.getElementById('mobileEmptyLibrary')
    const emptyGrid = document.getElementById('mobileEmptyGrid')
    const musicList = document.getElementById('mobileMusicList')
    const musicGrid = document.getElementById('mobileMusicGrid')
    if (emptyLibrary) emptyLibrary.style.display = isEmpty ? 'flex' : 'none'
    if (emptyGrid) emptyGrid.style.display = isEmpty ? 'flex' : 'none'
    if (musicList) musicList.innerHTML = ''
    if (musicGrid) musicGrid.innerHTML = ''
    if (isEmpty) return
    if (viewMode === 'list') displayMusicList(musics)
    else displayMusicGrid(musics)
}

// Afficher liste
function displayMusicList(musics) {
    const container = document.getElementById('mobileMusicList')
    if (!container) return
    musics.forEach((music, index) => {
        const item = createMusicListItem(music, index)
        container.appendChild(item)
    })
}

// Créer élément liste
function createMusicListItem(music, index) {
    const item = document.createElement('div')
    item.className = 'music-item'
    item.dataset.index = index
    const duration = formatTime(music.duration)
    const shortTitle = shortenText(music.title, 25)
    const shortArtist = shortenText(music.artist || 'Artiste inconnu', 20)
    item.innerHTML = `
        <div class="music-cover">
            <i class="fas fa-music"></i>
        </div>
        <div class="music-info">
            <div class="music-title">${shortTitle}</div>
            <div class="music-artist">${shortArtist}</div>
            <div class="music-duration">${duration}</div>
        </div>
    `
    item.addEventListener('click', () => selectAndPlayMusic(index))
    setupLongPress(item, music)
    return item
}

// Afficher grille
function displayMusicGrid(musics) {
    const container = document.getElementById('mobileMusicGrid')
    if (!container) return
    musics.forEach((music, index) => {
        const card = createMusicGridCard(music, index)
        container.appendChild(card)
    })
}

// Créer carte grille
function createMusicGridCard(music, index) {
    const card = document.createElement('div')
    card.className = 'music-card'
    card.dataset.index = index
    const shortTitle = shortenText(music.title, 15)
    const shortArtist = shortenText(music.artist || 'Artiste inconnu', 12)
    card.innerHTML = `
        <div class="card-cover">
            <i class="fas fa-music"></i>
        </div>
        <div class="card-info">
            <div class="card-title">${shortTitle}</div>
            <div class="card-artist">${shortArtist}</div>
        </div>
    `
    card.addEventListener('click', () => selectAndPlayMusic(index))
    setupLongPress(card, music)
    return card
}

// Configurer appui long
function setupLongPress(element, music) {
    let pressTimer
    element.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            if (checkAuth()) {
                element.classList.add('long-press')
                if (navigator.vibrate) navigator.vibrate(50)
                showGridOptions(music, element, e)
            }
        }, 600)
    })
    element.addEventListener('touchend', () => {
        clearTimeout(pressTimer)
        element.classList.remove('long-press')
    })
    element.addEventListener('touchmove', () => {
        clearTimeout(pressTimer)
        element.classList.remove('long-press')
    })
}

// Afficher options
function showGridOptions(music, element, event) {
    const existingOptions = element.querySelector('.grid-options')
    if (existingOptions) existingOptions.remove()
    const options = document.createElement('div')
    options.className = 'grid-options'
    options.innerHTML = `
        <button class="option-btn download-option">
            <i class="fas fa-download"></i> <span>Télécharger</span>
        </button>
        <button class="option-btn delete-option">
            <i class="fas fa-trash-alt"></i> <span>Supprimer</span>
        </button>
    `
    element.appendChild(options)
    const downloadBtn = options.querySelector('.download-option')
    downloadBtn.addEventListener('click', async (e) => {
        e.stopPropagation()
        options.remove()
        await downloadMusic(music)
    })
    const deleteBtn = options.querySelector('.delete-option')
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation()
        options.remove()
        await deleteMusic(music, element)
    })
    setTimeout(() => {
        const closeOptions = (e) => {
            if (!options.contains(e.target) && !element.contains(e.target)) {
                options.remove()
                document.removeEventListener('click', closeOptions)
                document.removeEventListener('touchstart', closeOptions)
            }
        }
        document.addEventListener('click', closeOptions)
        document.addEventListener('touchstart', closeOptions)
    }, 100)
}

// Vérifier authentification
function checkAuth() {
    if (!currentUser) {
        showNotification('Connectez-vous pour cette action', 'error')
        return false
    }
    return true
}

// Télécharger musique
async function downloadMusic(music) {
    if (!checkAuth()) return
    try {
        const shortFileName = shortenText(music.file_name || `${music.title}.mp3`, 25)
        showDownloadOverlay(shortFileName)
        updateDownloadProgress(10, 'Préparation...')
        const { data: signedData, error } = await supabase.storage
            .from('musics')
            .createSignedUrl(music.file_path, 60)
        if (error || !signedData?.signedUrl) throw error
        updateDownloadProgress(30, 'Connexion...')
        const response = await fetch(signedData.signedUrl)
        if (!response.ok) throw new Error('Erreur réseau')
        const blob = await response.blob()
        updateDownloadProgress(95, 'Finalisation...')
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = music.file_name || `${music.title}.mp3`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        updateDownloadProgress(100, '✅ Terminé !')
        setTimeout(() => {
            hideDownloadOverlay()
            showNotification('Téléchargement réussi', 'success')
        }, 1000)
    } catch (error) {
        console.error('Erreur téléchargement:', error)
        updateDownloadProgress(0, '❌ Erreur')
        showNotification('Échec du téléchargement', 'error')
        setTimeout(() => hideDownloadOverlay(), 2000)
    }
}

// Supprimer musique
async function deleteMusic(music, element) {
    if (!checkAuth()) return
    if (!confirm('Supprimer cette musique ?')) return
    try {
        showLoadingBar()
        await supabase.storage.from('musics').remove([music.file_path])
        await supabase.from('musics').delete().eq('id', music.id)
        element.style.transition = 'all 0.3s ease'
        element.style.opacity = '0.5'
        element.style.transform = 'scale(0.9)'
        setTimeout(() => {
            element.style.opacity = '0'
            element.style.transform = 'scale(0.8) translateY(20px)'
            setTimeout(async () => {
                currentPlaylist = currentPlaylist.filter(m => m.id !== music.id)
                searchResults = searchResults.filter(m => m.id !== music.id)
                displayMusics(searchResults.length > 0 ? searchResults : currentPlaylist)
                await updateStorageInfo()
                checkViewToggleVisibility()
                showNotification('Musique supprimée', 'success')
                hideLoadingBar()
            }, 300)
        }, 200)
    } catch (error) {
        console.error('Erreur suppression:', error)
        hideLoadingBar()
        showNotification('Erreur de suppression', 'error')
    }
}

// Recherche
async function handleSearch(searchTerm) {
    if (!searchTerm.trim() || !currentUser) {
        displayMusics(currentPlaylist)
        searchResults = []
        return
    }
    try {
        const term = searchTerm.toLowerCase()
        const results = currentPlaylist.filter(music => 
            music.title.toLowerCase().includes(term) ||
            (music.artist && music.artist.toLowerCase().includes(term))
        )
        searchResults = results
        if (results.length === 0) {
            const noResultsHtml = `
                <div class="no-results-message">
                    <i class="fas fa-search"></i>
                    <h3>Aucun résultat</h3>
                    <p>Aucune musique ne correspond à votre recherche</p>
                </div>
            `
            const musicList = document.getElementById('mobileMusicList')
            const musicGrid = document.getElementById('mobileMusicGrid')
            if (musicList) musicList.innerHTML = noResultsHtml
            if (musicGrid) musicGrid.innerHTML = noResultsHtml
        } else {
            displayMusics(results)
        }
    } catch (error) {
        console.error('Erreur recherche:', error)
        showNotification('Erreur lors de la recherche', 'error')
    }
}

// Sélectionner et jouer musique
function selectAndPlayMusic(index) {
    const playlist = searchResults.length > 0 ? searchResults : currentPlaylist
    if (!playlist[index]) return
    const music = playlist[index]
    currentMusicIndex = currentPlaylist.findIndex(m => m.id === music.id)
    updatePlayerDisplay(music)
    const nowPlayingBar = document.getElementById('nowPlayingBar')
    if (nowPlayingBar) nowPlayingBar.classList.add('show')
    playMusic(music)
}

// Mettre à jour affichage player
function updatePlayerDisplay(music) {
    const trackTitle = document.getElementById('mobileTrackTitle')
    const trackArtist = document.getElementById('mobileTrackArtist')
    const fullscreenTitle = document.getElementById('fullscreenTrackTitle')
    const fullscreenArtist = document.getElementById('fullscreenTrackArtist')
    const shortTitle = shortenText(music.title, 25)
    const shortArtist = shortenText(music.artist || 'Artiste inconnu', 20)
    if (trackTitle) trackTitle.textContent = shortTitle
    if (trackArtist) trackArtist.textContent = shortArtist
    if (fullscreenTitle) fullscreenTitle.textContent = shortTitle
    if (fullscreenArtist) fullscreenArtist.textContent = shortArtist
    document.querySelectorAll('.music-item, .music-card').forEach(el => {
        el.classList.remove('playing')
    })
    const playingElement = document.querySelector(`[data-index="${currentMusicIndex}"]`)
    if (playingElement) playingElement.classList.add('playing')
}

// Jouer musique
async function playMusic(music) {
    try {
        showLoadingBar()
        const { data: signedData } = await supabase.storage
            .from('musics')
            .createSignedUrl(music.file_path, 3600)
        if (!signedData?.signedUrl) throw new Error('URL non disponible')
        const audioPlayer = document.getElementById('mobileAudioPlayer')
        if (!audioPlayer) return
        if (audioPlayer.src !== signedData.signedUrl) {
            audioPlayer.src = signedData.signedUrl
            audioPlayer.load()
        }
        await audioPlayer.play()
        isPlaying = true
        updatePlayButtons()
        hideLoadingBar()
    } catch (error) {
        console.error('Erreur lecture:', error)
        hideLoadingBar()
        showNotification('Impossible de lire', 'error')
    }
}

// Initialiser player audio
function initAudioPlayer() {
    const audioPlayer = document.getElementById('mobileAudioPlayer')
    if (!audioPlayer) return
    audioPlayer.preload = 'none'
    audioPlayer.volume = 0.8
    audioPlayer.addEventListener('loadeddata', () => {
        const timeTotal = document.getElementById('mobileTimeTotal')
        if (timeTotal) timeTotal.textContent = formatTime(audioPlayer.duration)
    })
    audioPlayer.addEventListener('timeupdate', () => {
        if (!audioPlayer.duration) return
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100
        const timeCurrent = document.getElementById('mobileTimeCurrent')
        const playerProgress = document.getElementById('mobilePlayerProgress')
        if (timeCurrent) timeCurrent.textContent = formatTime(audioPlayer.currentTime)
        if (playerProgress) playerProgress.style.width = `${progress}%`
    })
    audioPlayer.addEventListener('play', () => {
        isPlaying = true
        updatePlayButtons()
    })
    audioPlayer.addEventListener('pause', () => {
        isPlaying = false
        updatePlayButtons()
    })
    audioPlayer.addEventListener('ended', () => playNext())
}

// Mettre à jour boutons play
function updatePlayButtons() {
    const playBtn = document.getElementById('mobilePlayBtn')
    const fullscreenPlayBtn = document.getElementById('mobileFullscreenPlayBtn')
    if (!playBtn || !fullscreenPlayBtn) return
    const playIcon = playBtn.querySelector('i')
    const fullscreenPlayIcon = fullscreenPlayBtn.querySelector('i')
    if (!playIcon || !fullscreenPlayIcon) return
    if (isPlaying) {
        playIcon.className = 'fas fa-pause'
        fullscreenPlayIcon.className = 'fas fa-pause'
    } else {
        playIcon.className = 'fas fa-play'
        fullscreenPlayIcon.className = 'fas fa-play'
    }
}

// Musique suivante
function playNext() {
    if (currentPlaylist.length === 0) return
    const nextIndex = (currentMusicIndex + 1) % currentPlaylist.length
    selectAndPlayMusic(nextIndex)
}

// Musique précédente
function playPrev() {
    if (currentPlaylist.length === 0) return
    const prevIndex = (currentMusicIndex - 1 + currentPlaylist.length) % currentPlaylist.length
    selectAndPlayMusic(prevIndex)
}

// Upload fichier
async function handleFileUpload(file) {
    if (!checkAuth()) return
    if (!file.name.toLowerCase().endsWith('.mp3')) {
        showNotification('Seuls les fichiers MP3 sont acceptés', 'error')
        return
    }
    if (file.size > 50 * 1024 * 1024) {
        showNotification('Fichier trop volumineux (max 50MB)', 'error')
        return
    }
    const shortFileName = shortenText(file.name, 30)
    showUploadProgress(shortFileName)
    try {
        const fileId = crypto.randomUUID()
        const fileName = `${fileId}.mp3`
        const filePath = `${currentUser.id}/${fileName}`
        updateUploadProgress(10, 'Vérification...')
        const { data: existingFiles } = await supabase
            .from('musics')
            .select('file_size')
            .eq('user_id', currentUser.id)
        const totalSize = existingFiles?.reduce((sum, f) => sum + (f.file_size || 0), 0) || 0
        const maxSize = 1024 * 1024 * 1024
        if (totalSize + file.size > maxSize) {
            throw new Error('Espace de stockage insuffisant')
        }
        updateUploadProgress(30, 'Upload...')
        const { error: uploadError } = await supabase.storage
            .from('musics')
            .upload(filePath, file, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError
        updateUploadProgress(60, 'Extraction...')
        const duration = await new Promise((resolve) => {
            const audio = new Audio()
            audio.preload = 'metadata'
            audio.onloadedmetadata = () => {
                URL.revokeObjectURL(audio.src)
                resolve(Math.round(audio.duration))
            }
            audio.onerror = () => resolve(0)
            audio.src = URL.createObjectURL(file)
        })
        updateUploadProgress(80, 'Sauvegarde...')
        const { error: dbError } = await supabase
            .from('musics')
            .insert([{
                user_id: currentUser.id,
                title: file.name.replace(/\.mp3$/i, '').trim() || 'Sans titre',
                artist: 'Artiste inconnu',
                file_name: fileName,
                file_path: filePath,
                file_size: file.size,
                duration: duration,
                created_at: new Date().toISOString()
            }])
        if (dbError) throw dbError
        updateUploadProgress(100, '✅ Terminé !')
        setTimeout(async () => {
            hideUploadProgress()
            await loadLibrary()
            await updateStorageInfo()
            showNotification('Musique ajoutée !', 'success')
        }, 1000)
    } catch (error) {
        console.error('Erreur upload:', error)
        updateUploadProgress(0, `❌ ${error.message}`)
        showNotification(`Upload échoué: ${error.message}`, 'error')
        setTimeout(() => hideUploadProgress(), 2000)
    }
}

// Configurer événements
function setupEventListeners() {
    // Sidebar
    const menuToggle = document.getElementById('mobileMenuToggle')
    const sidebar = document.getElementById('mobileSidebar')
    const sidebarOverlay = document.getElementById('sidebarOverlay')
    const sidebarClose = document.getElementById('sidebarClose')
    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('show')
            sidebarOverlay.classList.add('show')
            document.body.style.overflow = 'hidden'
        })
        if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar)
        sidebarOverlay.addEventListener('click', closeSidebar)
    }
    // Navigation
    const navItems = document.querySelectorAll('.nav-item[data-section]')
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault()
            const section = item.dataset.section
            navItems.forEach(nav => nav.classList.remove('active'))
            item.classList.add('active')
            document.querySelectorAll('.mobile-section').forEach(s => {
                s.classList.remove('active')
            })
            const targetSection = document.getElementById(`mobile${section.charAt(0).toUpperCase() + section.slice(1)}Section`)
            if (targetSection) targetSection.classList.add('active')
            closeSidebar()
        })
    })
    // View toggle
    const viewToggle = document.getElementById('viewToggle')
    if (viewToggle) {
        viewToggle.addEventListener('click', () => {
            if (currentPlaylist.length === 0) {
                showNotification('Ajoutez d\'abord des musiques', 'info')
                return
            }
            viewMode = viewMode === 'list' ? 'grid' : 'list'
            updateViewModeUI()
            const message = viewMode === 'grid' ? 'Affichage grille' : 'Affichage liste'
            showNotification(message, 'success')
        })
    }
    // Recherche
    const searchInput = document.getElementById('mobileSearchInput')
    const searchClear = document.getElementById('mobileSearchClear')
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            handleSearch(e.target.value)
        }, 300))
        searchInput.addEventListener('input', function() {
            if (searchClear) searchClear.style.display = this.value ? 'block' : 'none'
        })
    }
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = ''
                searchInput.focus()
                handleSearch('')
                searchClear.style.display = 'none'
            }
        })
    }
    // Upload
    const uploadBtn = document.getElementById('mobileUploadBtn')
    const fileInput = document.getElementById('mobileFileInput')
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            if (checkAuth()) fileInput.click()
        })
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files)
            if (files.length > 0) {
                for (const file of files) await handleFileUpload(file)
            }
            fileInput.value = ''
        })
    }
    // Player controls
    const playBtn = document.getElementById('mobilePlayBtn')
    const fullscreenPlayBtn = document.getElementById('mobileFullscreenPlayBtn')
    const prevBtn = document.getElementById('mobilePrevBtn')
    const nextBtn = document.getElementById('mobileNextBtn')
    if (playBtn) playBtn.addEventListener('click', togglePlayPause)
    if (fullscreenPlayBtn) fullscreenPlayBtn.addEventListener('click', togglePlayPause)
    if (prevBtn) prevBtn.addEventListener('click', playPrev)
    if (nextBtn) nextBtn.addEventListener('click', playNext)
    // Fullscreen player
    const nowPlayingBar = document.getElementById('nowPlayingBar')
    const playerFullscreen = document.getElementById('playerFullscreen')
    const playerCloseBtn = document.getElementById('playerCloseBtn')
    if (nowPlayingBar && playerFullscreen) {
        nowPlayingBar.addEventListener('click', () => {
            playerFullscreen.classList.add('show')
            document.body.style.overflow = 'hidden'
        })
    }
    if (playerCloseBtn && playerFullscreen) {
        playerCloseBtn.addEventListener('click', () => {
            playerFullscreen.classList.remove('show')
            document.body.style.overflow = ''
        })
    }
    // Progression
    const progressContainer = document.getElementById('progressContainer')
    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            const audioPlayer = document.getElementById('mobileAudioPlayer')
            if (!audioPlayer || !audioPlayer.duration) return
            const rect = progressContainer.getBoundingClientRect()
            const percent = (e.clientX - rect.left) / rect.width
            audioPlayer.currentTime = percent * audioPlayer.duration
        })
    }
    // Volume
    const volumeSlider = document.getElementById('mobileVolumeSlider')
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const audioPlayer = document.getElementById('mobileAudioPlayer')
            if (audioPlayer) audioPlayer.volume = e.target.value / 100
        })
    }
    // Déconnexion
    const logoutBtn = document.getElementById('mobileLogoutBtn')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault()
            if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
                showLoadingBar()
                try {
                    await supabase.auth.signOut()
                    showNotification('Déconnexion réussie', 'success')
                    setTimeout(() => window.location.href = 'index.html', 1500)
                } catch (error) {
                    console.error('Erreur déconnexion:', error)
                    hideLoadingBar()
                    showNotification('Erreur de déconnexion', 'error')
                }
            }
        })
    }
    // Download overlay
    const downloadCloseBtn = document.getElementById('downloadCloseBtn')
    const downloadOverlay = document.getElementById('downloadOverlay')
    if (downloadCloseBtn && downloadOverlay) {
        downloadCloseBtn.addEventListener('click', () => {
            downloadOverlay.classList.remove('show')
        })
    }
}

// Fermer sidebar
function closeSidebar() {
    const sidebar = document.getElementById('mobileSidebar')
    const sidebarOverlay = document.getElementById('sidebarOverlay')
    if (sidebar) sidebar.classList.remove('show')
    if (sidebarOverlay) sidebarOverlay.classList.remove('show')
    document.body.style.overflow = ''
}

// Vérifier view toggle
function checkViewToggleVisibility() {
    const viewToggle = document.getElementById('viewToggle')
    if (!viewToggle) return
    viewToggle.style.display = currentPlaylist.length === 0 ? 'none' : 'flex'
}

// Debounce
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

// Formater temps
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Notification
function showNotification(message, type = 'info') {
    document.querySelectorAll('.mobile-notification').forEach(n => n.remove())
    const notification = document.createElement('div')
    notification.className = 'mobile-notification'
    notification.textContent = message
    notification.style.cssText = `
        position: fixed;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#38a169' : 
                     type === 'error' ? '#e53e3e' : 
                     type === 'warning' ? '#ed8936' : '#3182ce'};
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        z-index: 2000;
        font-size: 0.85rem;
        animation: slideDown 0.3s ease;
        max-width: 85%;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-weight: 500;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    `
    document.body.appendChild(notification)
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease'
        setTimeout(() => notification.remove(), 300)
    }, 3000)
}

// Loading bar
function showLoadingBar() {
    const loadingBar = document.getElementById('loadingBar')
    if (loadingBar) {
        loadingBar.style.display = 'block'
        setTimeout(() => loadingBar.classList.add('active'), 10)
    }
}

function hideLoadingBar() {
    const loadingBar = document.getElementById('loadingBar')
    if (loadingBar) {
        loadingBar.classList.remove('active')
        setTimeout(() => loadingBar.style.display = 'none', 300)
    }
}

// Upload progress
function showUploadProgress(filename) {
    const uploadProgress = document.getElementById('mobileUploadProgress')
    const progressText = document.getElementById('mobileProgressText')
    const progressFill = document.getElementById('mobileProgressFill')
    const progressPercent = document.getElementById('mobileProgressPercent')
    if (uploadProgress) {
        uploadProgress.style.display = 'block'
        setTimeout(() => uploadProgress.classList.add('show'), 10)
    }
    if (progressText) progressText.textContent = filename
    if (progressFill) progressFill.style.width = '0%'
    if (progressPercent) progressPercent.textContent = '0%'
}

function updateUploadProgress(percent, message) {
    const progressFill = document.getElementById('mobileProgressFill')
    const progressPercent = document.getElementById('mobileProgressPercent')
    const progressText = document.getElementById('mobileProgressText')
    if (progressFill) progressFill.style.width = `${percent}%`
    if (progressPercent) progressPercent.textContent = `${percent}%`
    if (progressText && message) progressText.textContent = message
}

function hideUploadProgress() {
    const uploadProgress = document.getElementById('mobileUploadProgress')
    if (uploadProgress) {
        uploadProgress.classList.remove('show')
        setTimeout(() => uploadProgress.style.display = 'none', 300)
    }
}

// Download overlay
function showDownloadOverlay(filename) {
    const downloadOverlay = document.getElementById('downloadOverlay')
    const downloadFileName = document.getElementById('downloadFileName')
    if (downloadOverlay) downloadOverlay.classList.add('show')
    if (downloadFileName) downloadFileName.textContent = filename
}

function updateDownloadProgress(percent, message) {
    const downloadProgressFill = document.getElementById('downloadProgressFill')
    const downloadProgressPercent = document.getElementById('downloadProgressPercent')
    const downloadMessage = document.getElementById('downloadMessage')
    if (downloadProgressFill) downloadProgressFill.style.width = `${percent}%`
    if (downloadProgressPercent) downloadProgressPercent.textContent = `${percent}%`
    if (downloadMessage) downloadMessage.textContent = message
}

function hideDownloadOverlay() {
    const downloadOverlay = document.getElementById('downloadOverlay')
    if (downloadOverlay) downloadOverlay.classList.remove('show')
}

// Play/pause
function togglePlayPause() {
    const audioPlayer = document.getElementById('mobileAudioPlayer')
    if (!audioPlayer) return
    if (!audioPlayer.src) {
        if (currentPlaylist.length > 0) selectAndPlayMusic(0)
        else showNotification('Ajoutez d\'abord des musiques', 'info')
        return
    }
    if (audioPlayer.paused) audioPlayer.play()
    else audioPlayer.pause()
}

// Styles animations
const style = document.createElement('style')
style.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-30px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-30px); opacity: 0; }
    }
    .login-btn {
        background: linear-gradient(135deg, var(--primary-light), var(--primary-dark));
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: var(--border-radius-md);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 15px;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);
    }
    .login-btn:active { transform: scale(0.95); }
    .drag-over { outline: 3px dashed var(--primary-light) !important; }
`
document.head.appendChild(style)

console.log('🚀 Cloud Music Mobile - Version finale prête !')
