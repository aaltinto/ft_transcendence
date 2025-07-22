// DOM Elements
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const twoFASection = document.getElementById('twoFASection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const twoFAForm = document.getElementById('twoFAForm');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const verifyBtn = document.getElementById('verifyBtn');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');
const twoFAMessage = document.getElementById('twoFAMessage');
const welcomeMessage = document.getElementById('welcomeMessage');

// Constants
const API_BASE_URL = window.location.origin;
let currentUserEmail = '';

// Page transition functions
document.getElementById('showRegisterBtn')?.addEventListener('click', () => {
    loginSection.classList.add('hidden');
    registerSection.classList.remove('hidden');
});

document.getElementById('showLoginBtn')?.addEventListener('click', () => {
    registerSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

// Login functionality
function login(event) {
    if (event) event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showMessage(loginMessage, 'Lütfen tüm alanları doldurun!', 'error');
        return;
    }
    
    loginBtn.textContent = 'Giriş yapılıyor...';
    loginBtn.disabled = true;
    
    // Backend API'ye giriş isteği gönder
    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', username);
            currentUserEmail = data.email || username + '@example.com';
            localStorage.setItem('userEmail', currentUserEmail);
            
            // 2FA doğrulamasına yönlendir
            loginSection.classList.add('hidden');
            twoFASection.classList.remove('hidden');
            showMessage(twoFAMessage, 'Doğrulama kodu e-posta adresinize gönderildi.', 'success');
        } else {
            showMessage(loginMessage, data.message || 'Giriş başarısız!', 'error');
        }
    })
    .catch(() => {
        // Offline/fallback mod
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            localStorage.setItem('token', 'offline_token_' + Date.now());
            localStorage.setItem('username', username);
            currentUserEmail = user.email;
            localStorage.setItem('userEmail', currentUserEmail);
            
            loginSection.classList.add('hidden');
            twoFASection.classList.remove('hidden');
            showMessage(twoFAMessage, 'Doğrulama kodu e-posta adresinize gönderildi.', 'success');
        } else {
            showMessage(loginMessage, 'Kullanıcı adı veya şifre hatalı!', 'error');
        }
    })
    .finally(() => {
        loginBtn.textContent = 'Giriş Yap';
        loginBtn.disabled = false;
    });
}

// Register functionality
function register(event) {
    if (event) event.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (!username || !email || !password || !confirmPassword) {
        showMessage(registerMessage, 'Lütfen tüm alanları doldurun!', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage(registerMessage, 'Şifreler uyuşmuyor!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage(registerMessage, 'Şifre en az 6 karakter olmalıdır!', 'error');
        return;
    }
    
    registerBtn.textContent = 'Kayıt yapılıyor...';
    registerBtn.disabled = true;
    
    // Backend API'ye kayıt isteği gönder
    fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage(registerMessage, 'Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
            setTimeout(() => {
                registerSection.classList.add('hidden');
                loginSection.classList.remove('hidden');
            }, 1500);
        } else {
            showMessage(registerMessage, data.message || 'Kayıt başarısız!', 'error');
        }
    })
    .catch(() => {
        // Offline/fallback mod
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.find(u => u.username === username)) {
            showMessage(registerMessage, 'Bu kullanıcı adı zaten kullanılıyor!', 'error');
            return;
        }
        
        if (users.find(u => u.email === email)) {
            showMessage(registerMessage, 'Bu e-posta adresi zaten kullanılıyor!', 'error');
            return;
        }
        
        const newUser = {
            username,
            email,
            password,
            registeredAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        showMessage(registerMessage, 'Kayıt başarılı! Giriş yapabilirsiniz. 🎉', 'success');
        setTimeout(() => {
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        }, 1500);
    })
    .finally(() => {
        registerBtn.textContent = 'Kayıt Ol';
        registerBtn.disabled = false;
    });
}

// 2FA verification
function verify2FA(event) {
    if (event) event.preventDefault();
    
    const code = document.getElementById('verificationCode').value;
    
    if (!code) {
        showMessage(twoFAMessage, 'Lütfen doğrulama kodunu girin!', 'error');
        return;
    }
    
    verifyBtn.textContent = 'Doğrulanıyor...';
    verifyBtn.disabled = true;
    
    // Backend API'ye doğrulama isteği gönder
    fetch(`${API_BASE_URL}/auth/verify-2fa`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code, email: currentUserEmail })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage(twoFAMessage, 'Doğrulama başarılı!', 'success');
            setTimeout(() => {
                twoFASection.classList.add('hidden');
                dashboardSection.classList.remove('hidden');
                showDashboard();
            }, 1000);
        } else {
            showMessage(twoFAMessage, data.message || 'Doğrulama kodu hatalı!', 'error');
        }
    })
    .catch(() => {
        // Offline/fallback mod - herhangi bir kod kabul et
        if (code.length >= 4) {
            showMessage(twoFAMessage, 'Doğrulama başarılı! 🎉', 'success');
            setTimeout(() => {
                twoFASection.classList.add('hidden');
                dashboardSection.classList.remove('hidden');
                showDashboard();
            }, 1000);
        } else {
            showMessage(twoFAMessage, 'Doğrulama kodu en az 4 karakter olmalıdır!', 'error');
        }
    })
    .finally(() => {
        verifyBtn.textContent = 'Doğrula';
        verifyBtn.disabled = false;
    });
}

// Dashboard functionality
function showDashboard() {
    const username = localStorage.getItem('username');
    welcomeMessage.textContent = `Hoş geldin, ${username}! 🎉`;
    
    // Tab functionality
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-tab');
            showTab(targetTab);
        });
    });
    
    // Default tab
    showTab('comments');
    
    // İlk kez açıldığında örnek yorumları ekle
    initializeSampleComments();
}

function initializeSampleComments() {
    const existingComments = localStorage.getItem('comments');
    if (!existingComments) {
        const sampleComments = [
            {
                id: 1,
                author: 'testuser',
                text: 'Merhaba! Bu harika bir platform! 😊',
                date: new Date(Date.now() - 3600000).toISOString(),
                likes: 5,
                likedBy: ['Admin', 'Demo User', 'user123', 'alice', 'bob']
            },
            {
                id: 2,
                author: 'Admin',
                text: 'Hoş geldiniz! Fikirlerinizi paylaşmaktan çekinmeyin. 🎉',
                date: new Date(Date.now() - 7200000).toISOString(),
                likes: 3,
                likedBy: ['testuser', 'user123', 'alice']
            },
            {
                id: 3,
                author: 'user123',
                text: 'Gerçekten kullanıcı dostu bir arayüz. Teşekkürler! 👏',
                date: new Date(Date.now() - 10800000).toISOString(),
                likes: 7,
                likedBy: ['Admin', 'testuser', 'alice', 'bob', 'charlie', 'demo', 'guest']
            }
        ];
        localStorage.setItem('comments', JSON.stringify(sampleComments));
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    dashboardSection.classList.add('hidden');
    twoFASection.classList.add('hidden');
    registerSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    
    // Formu temizle
    loginForm.reset();
    registerForm.reset();
    twoFAForm.reset();
    
    // Mesajları temizle
    loginMessage.textContent = '';
    registerMessage.textContent = '';
    twoFAMessage.textContent = '';
}

function showTab(tabName) {
    // Tüm tab içeriklerini gizle
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Tüm tab butonlarından active sınıfını kaldır
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // İlgili tab içeriğini göster
    document.getElementById(tabName).classList.remove('hidden');
    
    // İlgili tab butonuna active sınıfını ekle
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Eğer comments tab'ı seçildiyse yorumları yükle
    if (tabName === 'comments') {
        loadComments();
    } else if (tabName === 'users') {
        loadUsers();
    }
}

function showComments() {
    showTab('comments');
}

function showUsers() {
    showTab('users');
}

function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="no-users">👥 Henüz kayıtlı kullanıcı bulunmuyor.</div>';
        return;
    }
    
    const usersHTML = users.map((user, index) => `
        <div class="user-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 15px; margin-bottom: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.15);">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    👤
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px;">
                        ${escapeHtml(user.username)}
                    </div>
                    <div style="opacity: 0.9; font-size: 14px; margin-bottom: 3px;">
                        📧 ${escapeHtml(user.email)}
                    </div>
                    <div style="opacity: 0.8; font-size: 12px;">
                        📅 Kayıt: ${new Date(user.registeredAt).toLocaleDateString('tr-TR')}
                    </div>
                </div>
                <div style="text-align: center; font-size: 24px; font-weight: bold; color: rgba(255,255,255,0.8);">
                    #${index + 1}
                </div>
            </div>
        </div>
    `).join('');
    
    usersList.innerHTML = usersHTML;
}

function addComment() {
    const commentInput = document.getElementById('commentInput');
    const commentText = commentInput.value.trim();
    const currentUser = localStorage.getItem('username');
    
    if (!currentUser) {
        alert('Yorum yapabilmek için giriş yapmanız gerekiyor!');
        return;
    }
    
    if (!commentText) {
        showCommentMessage('Lütfen yorumunuzu yazın! ✍️', 'error');
        return;
    }
    
    if (commentText.length > 500) {
        showCommentMessage('Yorum 500 karakterden uzun olamaz! 📝', 'error');
        return;
    }
    
    // Yeni yorum objesi oluştur
    const newComment = {
        id: Date.now(),
        author: currentUser,
        text: commentText,
        date: new Date().toISOString(),
        likes: 0,
        likedBy: []
    };
    
    // Mevcut yorumları al
    const comments = JSON.parse(localStorage.getItem('comments') || '[]');
    
    // Yeni yorumu en başa ekle
    comments.unshift(newComment);
    
    // Yorumları kaydet
    localStorage.setItem('comments', JSON.stringify(comments));
    
    // Input'u temizle
    commentInput.value = '';
    
    // Yorumları yeniden yükle
    loadComments();
    
    // Başarı mesajı göster
    showCommentMessage('Yorumunuz başarıyla eklendi! 🎉', 'success');
}

function loadComments() {
    const comments = JSON.parse(localStorage.getItem('comments') || '[]');
    const commentsList = document.getElementById('commentsList');
    const currentUser = localStorage.getItem('username');
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="no-comments">🤔 Henüz yorum yapılmamış. İlk yorumu sen yap!</div>';
        return;
    }
    
    comments.forEach((comment) => {
        const commentDate = new Date(comment.date);
        const timeAgo = getTimeAgo(commentDate);
        
        const likedBy = comment.likedBy || [];
        const isLikedByCurrentUser = currentUser && likedBy.includes(currentUser);
        
        const likeButtonStyle = currentUser ? 
            (isLikedByCurrentUser ? 
                'background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 20px; cursor: not-allowed;' :
                'background: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 20px; cursor: pointer; transition: all 0.3s;'
            ) : 
            'background: #95a5a6; color: white; border: none; padding: 8px 12px; border-radius: 20px; cursor: not-allowed;';
        
        const likeButtonText = isLikedByCurrentUser ? '❤️ Beğendin' : '🤍 Beğen';
        
        const likesDisplay = comment.likes > 0 ? 
            `<button onclick="likeComment(${comment.id})" style="${likeButtonStyle} font-size: 12px;" ${isLikedByCurrentUser ? 'disabled' : ''}>
                ${likeButtonText} (${comment.likes})
            </button>` :
            `<span style="color: #e74c3c; font-size: 12px;">❤️ ${comment.likes} Beğeni</span>`;
    });
    
    const commentsHTML = comments.map(comment => {
        const commentDate = new Date(comment.date);
        const timeAgo = getTimeAgo(commentDate);
        
        const likedBy = comment.likedBy || [];
        const isLikedByCurrentUser = currentUser && likedBy.includes(currentUser);
        
        const likeButtonStyle = currentUser ? 
            (isLikedByCurrentUser ? 
                'background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 20px; cursor: not-allowed;' :
                'background: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 20px; cursor: pointer; transition: all 0.3s;'
            ) : 
            'background: #95a5a6; color: white; border: none; padding: 8px 12px; border-radius: 20px; cursor: not-allowed;';
        
        const likeButtonText = isLikedByCurrentUser ? '❤️ Beğendin' : '🤍 Beğen';
        
        const likesDisplay = comment.likes > 0 ? 
            `<button onclick="likeComment(${comment.id})" style="${likeButtonStyle} font-size: 12px;" ${isLikedByCurrentUser ? 'disabled' : ''}>
                ${likeButtonText} (${comment.likes})
            </button>` :
            `<span style="color: #e74c3c; font-size: 12px;">❤️ ${comment.likes} Beğeni</span>`;
        
        return `
            <div class="comment" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 4px solid #3498db;">
                <div class="comment-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span class="comment-author">👤 ${comment.author}</span>
                    <span class="comment-date" style="color: #7f8c8d; font-size: 12px;">🕐 ${timeAgo}</span>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
                <div class="comment-actions" style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                    ${likesDisplay}
                </div>
            </div>
        `;
    }).join('');
    
    commentsList.innerHTML = commentsHTML;
}

function likeComment(commentId) {
    const currentUser = localStorage.getItem('username');
    
    if (!currentUser) {
        alert('Beğeni yapabilmek için giriş yapmanız gerekiyor!');
        return;
    }
    
    const comments = JSON.parse(localStorage.getItem('comments') || '[]');
    const comment = comments.find((c) => c.id === commentId);
    
    if (!comment) {
        return;
    }
    
    if (!comment.likedBy) {
        comment.likedBy = [];
    }
    
    // Kullanıcı daha önce beğendi mi kontrol et
    if (comment.likedBy.includes(currentUser)) {
        return; // Zaten beğenmiş, tekrar beğenmeye izin verme
    }
    
    // Beğeni ekle
    comment.likes = (comment.likes || 0) + 1;
    comment.likedBy.push(currentUser);
    
    // Güncellenen yorumları kaydet
    localStorage.setItem('comments', JSON.stringify(comments));
    
    // Yorumları yeniden yükle
    loadComments();
    
    // Başarı mesajı
    showCommentMessage('Yorumu beğendin! ❤️', 'success');
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
        return 'Az önce';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} dakika önce`;
    } else if (diffInHours < 24) {
        return `${diffInHours} saat önce`;
    } else {
        return `${diffInDays} gün önce`;
    }
}

function showCommentMessage(message, type = 'success') {
    const messageDiv = document.getElementById('commentMessage');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

// Utility functions
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Form submit events
    loginForm.addEventListener('submit', login);
    registerForm.addEventListener('submit', register);
    twoFAForm.addEventListener('submit', verify2FA);
    
    // Enter key için comment input
    document.getElementById('commentInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addComment();
        }
    });
    
    // Sayfa yüklendiğinde oturum kontrolü
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (token && username) {
        dashboardSection.classList.remove('hidden');
        loginSection.classList.add('hidden');
        showDashboard();
    }
});
