import { supabase } from './supabase.js'

// Éléments DOM
const loginForm = document.getElementById('loginForm')
const signupForm = document.getElementById('signupForm')
const forgotForm = document.getElementById('forgotForm')
const showSignup = document.getElementById('showSignup')
const showLogin = document.getElementById('showLogin')
const showLoginFromForgot = document.getElementById('showLoginFromForgot')
const forgotPassword = document.getElementById('forgotPassword')
const loadingOverlay = document.getElementById('loadingOverlay')
const notificationContainer = document.getElementById('notificationContainer')

// Variables d'état
let currentForm = 'login'

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si déjà connecté
    checkExistingSession()
    
    // Configurer les événements
    setupEventListeners()
    
    // Configurer password toggles
    setupPasswordToggles()
    
    // Configurer les boutons ripple
    setupRippleEffects()
})

// Vérifier session existante
async function checkExistingSession() {
    showLoading(true)
    
    try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
            // Rediriger vers le dashboard
            redirectToDashboard()
        }
    } catch (error) {
        console.error('Erreur vérification session:', error)
    } finally {
        showLoading(false)
    }
}

// Redirection vers dashboard
function redirectToDashboard() {
    // Détecter l'appareil pour choisir la version
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const screenWidth = window.innerWidth
    
    let targetPage = 'dashboard.html'
    
    if (isMobile || screenWidth < 768) {
        targetPage = 'mobile.html'
    }
    
    window.location.href = targetPage
}

// Configurer les événements
function setupEventListeners() {
    // Navigation entre formulaires
    showSignup?.addEventListener('click', (e) => {
        e.preventDefault()
        switchForm('signup')
    })
    
    showLogin?.addEventListener('click', (e) => {
        e.preventDefault()
        switchForm('login')
    })
    
    forgotPassword?.addEventListener('click', (e) => {
        e.preventDefault()
        switchForm('forgot')
    })
    
    showLoginFromForgot?.addEventListener('click', (e) => {
        e.preventDefault()
        switchForm('login')
    })
    
    // Soumission des formulaires
    loginForm?.addEventListener('submit', handleLogin)
    signupForm?.addEventListener('submit', handleSignup)
    forgotForm?.addEventListener('submit', handleForgotPassword)
}

// Changer de formulaire
function switchForm(formName) {
    // Cacher tous les formulaires
    [loginForm, signupForm, forgotForm].forEach(form => {
        if (form) {
            form.classList.remove('active')
            form.style.display = 'none'
        }
    })
    
    // Afficher le formulaire demandé
    const targetForm = {
        login: loginForm,
        signup: signupForm,
        forgot: forgotForm
    }[formName]
    
    if (targetForm) {
        targetForm.style.display = 'block'
        setTimeout(() => {
            targetForm.classList.add('active')
        }, 10)
    }
    
    currentForm = formName
}

// Gestion de la connexion
async function handleLogin(e) {
    e.preventDefault()
    
    const email = document.getElementById('loginEmail').value.trim()
    const password = document.getElementById('loginPassword').value.trim()
    const rememberMe = document.getElementById('rememberMe').checked
    
    // Validation
    if (!email || !password) {
        showNotification('Veuillez remplir tous les champs', 'error')
        return
    }
    
    showLoading(true)
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        
        if (error) throw error
        
        // Succès
        showNotification('Connexion réussie ! Redirection...', 'success')
        
        // Redirection après court délai
        setTimeout(() => {
            redirectToDashboard()
        }, 1500)
        
    } catch (error) {
        console.error('Erreur connexion:', error)
        
        // Messages d'erreur personnalisés
        let message = 'Erreur de connexion'
        
        if (error.message.includes('Invalid login credentials')) {
            message = 'Email ou mot de passe incorrect'
        } else if (error.message.includes('Email not confirmed')) {
            message = 'Veuillez confirmer votre email'
        } else if (error.message.includes('rate limit')) {
            message = 'Trop de tentatives. Réessayez plus tard'
        }
        
        showNotification(message, 'error')
        
    } finally {
        showLoading(false)
    }
}

// Gestion de l'inscription
async function handleSignup(e) {
    e.preventDefault()
    
    const username = document.getElementById('signupUsername').value.trim()
    const email = document.getElementById('signupEmail').value.trim()
    const password = document.getElementById('signupPassword').value.trim()
    const confirmPassword = document.getElementById('signupConfirm').value.trim()
    const acceptTerms = document.getElementById('acceptTerms').checked
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showNotification('Veuillez remplir tous les champs', 'error')
        return
    }
    
    if (password !== confirmPassword) {
        showNotification('Les mots de passe ne correspondent pas', 'error')
        return
    }
    
    if (password.length < 6) {
        showNotification('Le mot de passe doit faire au moins 6 caractères', 'error')
        return
    }
    
    if (!acceptTerms) {
        showNotification('Veuillez accepter les conditions d\'utilisation', 'error')
        return
    }
    
    showLoading(true)
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    created_at: new Date().toISOString()
                },
                emailRedirectTo: `${window.location.origin}/index.html?verified=true`
            }
        })
        
        if (error) throw error
        
        // Succès
        if (data.user?.identities?.length === 0) {
            showNotification('Cet email est déjà utilisé', 'warning')
        } else {
            showNotification('Compte créé avec succès ! Vérifiez votre email.', 'success')
            
            // Revenir au formulaire de connexion
            setTimeout(() => {
                switchForm('login')
                // Pré-remplir l'email
                document.getElementById('loginEmail').value = email
            }, 2000)
        }
        
    } catch (error) {
        console.error('Erreur inscription:', error)
        
        let message = 'Erreur lors de l\'inscription'
        
        if (error.message.includes('already registered')) {
            message = 'Cet email est déjà utilisé'
        } else if (error.message.includes('invalid email')) {
            message = 'Email invalide'
        } else if (error.message.includes('password')) {
            message = 'Mot de passe trop faible'
        }
        
        showNotification(message, 'error')
        
    } finally {
        showLoading(false)
    }
}

// Gestion du mot de passe oublié
async function handleForgotPassword(e) {
    e.preventDefault()
    
    const email = document.getElementById('resetEmail').value.trim()
    
    if (!email) {
        showNotification('Veuillez entrer votre email', 'error')
        return
    }
    
    showLoading(true)
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/index.html?reset=true`
        })
        
        if (error) throw error
        
        showNotification('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.', 'success')
        
        // Revenir à la connexion
        setTimeout(() => {
            switchForm('login')
        }, 3000)
        
    } catch (error) {
        console.error('Erreur réinitialisation:', error)
        showNotification('Erreur lors de l\'envoi de l\'email', 'error')
    } finally {
        showLoading(false)
    }
}

// Configurer les toggles password
function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input')
            const icon = this.querySelector('i')
            
            if (input.type === 'password') {
                input.type = 'text'
                icon.className = 'fas fa-eye-slash'
            } else {
                input.type = 'password'
                icon.className = 'fas fa-eye'
            }
        })
    })
}

// Configurer les effets ripple
function setupRippleEffects() {
    document.querySelectorAll('.neo-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Créer l'effet ripple
            const ripple = document.createElement('div')
            ripple.className = 'btn-ripple'
            
            // Positionner
            const rect = this.getBoundingClientRect()
            const size = Math.max(rect.width, rect.height)
            const x = e.clientX - rect.left - size / 2
            const y = e.clientY - rect.top - size / 2
            
            ripple.style.width = ripple.style.height = `${size}px`
            ripple.style.left = `${x}px`
            ripple.style.top = `${y}px`
            
            this.appendChild(ripple)
            
            // Supprimer après animation
            setTimeout(() => {
                ripple.remove()
            }, 600)
        })
    })
}

// Afficher/cacher le loading
function showLoading(show) {
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.classList.add('active')
        } else {
            loadingOverlay.classList.remove('active')
        }
    }
}

// Afficher une notification
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
    
    notificationContainer.appendChild(notification)
    
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

// Vérifier les paramètres URL
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search)
    
    if (urlParams.has('verified')) {
        showNotification('Email vérifié avec succès ! Vous pouvez maintenant vous connecter.', 'success')
    }
    
    if (urlParams.has('reset')) {
        showNotification('Mot de passe réinitialisé avec succès ! Connectez-vous avec votre nouveau mot de passe.', 'success')
    }
}

// Initialiser la vérification des paramètres URL
checkUrlParams()

// Exporter les fonctions utiles
export { showNotification, showLoading }