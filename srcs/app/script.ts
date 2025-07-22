// TypeScript interfaces
interface User {
    username: string;
    email: string;
    password: string;
    registeredAt: string;
}

interface UserComment {
    id: number;
    author: string;
    text: string;
    date: string;
    likes: number;
    likedBy: string[];
}

interface LoginData {
    token?: string;
    message?: string;
    error?: string;
    success?: string;
}

interface DecodedToken {
    id: number;
    username: string;
    email: string;
    is_admin?: boolean;
    iat?: number;
    exp?: number;
}

// DOM Elements
const loginSection = document.getElementById('loginSection') as HTMLElement;
const registerSection = document.getElementById('registerSection') as HTMLElement;
const twoFASection = document.getElementById('twoFASection') as HTMLElement;
const dashboardSection = document.getElementById('dashboardSection') as HTMLElement;
const loginForm = document.getElementById('loginForm') as HTMLFormElement;
const registerForm = document.getElementById('registerForm') as HTMLFormElement;
const twoFAForm = document.getElementById('twoFAForm') as HTMLFormElement;
const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
const registerBtn = document.getElementById('registerBtn') as HTMLButtonElement;
const verifyBtn = document.getElementById('verifyBtn') as HTMLButtonElement;
const loginMessage = document.getElementById('loginMessage') as HTMLElement;
const registerMessage = document.getElementById('registerMessage') as HTMLElement;
const twoFAMessage = document.getElementById('twoFAMessage') as HTMLElement;
const welcomeMessage = document.getElementById('welcomeMessage') as HTMLElement;

// Constants
const API_BASE_URL: string = window.location.origin;
let currentUserEmail: string = '';

// JWT decode helper (basit bir implementasyon)
function decodeJWT(token: string): DecodedToken | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('JWT decode error:', error);
        return null;
    }
}

// Admin kontrolü
function isCurrentUserAdmin(): boolean {
    const token = localStorage.getItem('token');
    if (!token || token.startsWith('test_token_') || token.startsWith('local_token_')) {
        return false;
    }
    const decoded = decodeJWT(token);
    return decoded?.is_admin === true;
}

// Page transition functions
document.getElementById('showRegisterBtn')?.addEventListener('click', (): void => {
    loginSection.classList.add('hidden');
    registerSection.classList.remove('hidden');
});

document.getElementById('showLoginBtn')?.addEventListener('click', (): void => {
    registerSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

// Message display function
function showMessage(element: HTMLElement, message: string, type: string = 'error'): void {
    element.innerHTML = `<div class="${type}-message">${message}</div>`;
    setTimeout((): void => {
        element.innerHTML = '';
    }, 5000);
}

// Register form submit
registerForm.addEventListener('submit', async (e: Event): Promise<void> => {
    e.preventDefault();
    
    const username: string = (document.getElementById('regUsername') as HTMLInputElement).value.trim();
    const email: string = (document.getElementById('regEmail') as HTMLInputElement).value.trim();
    const password: string = (document.getElementById('regPassword') as HTMLInputElement).value;
    
    if (!username || !email || !password) {
        showMessage(registerMessage, 'Tüm alanları doldurmanız gerekiyor');
        return;
    }

    // Email format kontrolü
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage(registerMessage, 'Geçerli bir email adresi girin');
        return;
    }

    // Şifre uzunluk kontrolü
    if (password.length < 3) {
        showMessage(registerMessage, 'Şifre en az 3 karakter olmalıdır');
        return;
    }

    registerBtn.innerHTML = 'Kayıt yapılıyor...';
    registerBtn.disabled = true;

    try {
        // Kayıt edilmiş kullanıcıları kontrol et
        const registeredUsers: User[] = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        
        // Kullanıcı adı veya email zaten var mı kontrol et
        const existingUser: User | undefined = registeredUsers.find((u: User) => u.username === username || u.email === email);
        if (existingUser) {
            showMessage(registerMessage, 'Bu kullanıcı adı veya email adresi zaten kullanılıyor');
            registerBtn.innerHTML = 'Kayıt Ol';
            registerBtn.disabled = false;
            return;
        }

        // Yeni kullanıcıyı kaydet
        const newUser: User = {
            username: username,
            email: email,
            password: password,
            registeredAt: new Date().toISOString()
        };

        registeredUsers.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

        // Backend'e de kayıt yapmayı dene (opsiyonel)
        try {
            const response: Response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });
            
            if (response.ok) {
                console.log('User also registered in backend');
            }
        } catch (backendError) {
            console.log('Backend registration failed, but frontend registration successful');
        }

        showMessage(registerMessage, 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.', 'success');
        setTimeout((): void => {
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
            // Kullanıcı adını otomatik doldur
            (document.getElementById('username') as HTMLInputElement).value = username;
            (document.getElementById('regUsername') as HTMLInputElement).value = '';
            (document.getElementById('regEmail') as HTMLInputElement).value = '';
            (document.getElementById('regPassword') as HTMLInputElement).value = '';
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        showMessage(registerMessage, 'Kayıt sırasında hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        registerBtn.innerHTML = 'Kayıt Ol';
        registerBtn.disabled = false;
    }
});

// Login form submit
loginForm.addEventListener('submit', async (e: Event): Promise<void> => {
    e.preventDefault();
    
    const username: string = (document.getElementById('username') as HTMLInputElement).value.trim();
    const password: string = (document.getElementById('password') as HTMLInputElement).value;
    
    if (!username || !password) {
        showMessage(loginMessage, 'Kullanıcı adı ve şifre gerekli');
        return;
    }

    loginBtn.innerHTML = 'Giriş yapılıyor...';
    loginBtn.disabled = true;

    try {
        // Özel test kullanıcısı için direkt giriş
        if (username === 'testuser' && password === 'testpass123') {
            const testToken: string = 'test_token_' + Date.now();
            localStorage.setItem('token', testToken);
            localStorage.setItem('username', username);
            showMessage(loginMessage, 'Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
            setTimeout((): void => {
                showDashboard();
            }, 1500);
            return;
        }

        // Kayıt edilmiş kullanıcıları kontrol et
        const registeredUsers: User[] = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const user: User | undefined = registeredUsers.find((u: User) => u.username === username && u.password === password);
        
        if (user) {
            // Yerel kayıtlı kullanıcı bulundu
            const userToken: string = 'local_token_' + Date.now();
            localStorage.setItem('token', userToken);
            localStorage.setItem('username', username);
            localStorage.setItem('userEmail', user.email);
            showMessage(loginMessage, 'Giriş başarılı! Hoş geldin ' + username + '!', 'success');
            setTimeout((): void => {
                showDashboard();
            }, 1500);
            return;
        }

        // Backend ile giriş yapmayı dene
        const response: Response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data: LoginData = await response.json();

        if (response.ok) {
            if (data.message === 'Verification message send') {
                // 2FA kodu gönderildi, 2FA sayfasını göster
                showMessage(loginMessage, 'Doğrulama kodu email adresinize gönderildi', 'success');
                setTimeout((): void => {
                    loginSection.classList.add('hidden');
                    twoFASection.classList.remove('hidden');
                }, 2000);
            } else if (data.token) {
                // Direkt token alındıysa
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', username);
                showMessage(loginMessage, 'Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
                setTimeout((): void => {
                    showDashboard();
                }, 1500);
            }
        } else {
            // Backend'den hata geldi, kullanıcı bulunamadı
            showMessage(loginMessage, 'Kullanıcı adı veya şifre hatalı');
        }
    } catch (error) {
        console.error('Error:', error);
        // Bağlantı hatası durumunda da kayıtlı kullanıcıları kontrol ettik yukarıda
        showMessage(loginMessage, 'Kullanıcı adı veya şifre hatalı');
    } finally {
        loginBtn.innerHTML = 'Giriş Yap';
        loginBtn.disabled = false;
    }
});

// 2FA form submit
twoFAForm.addEventListener('submit', async (e: Event): Promise<void> => {
    e.preventDefault();
    
    const code: string = (document.getElementById('verificationCode') as HTMLInputElement).value.trim();
    const username: string = (document.getElementById('username') as HTMLInputElement).value.trim();
    
    if (!code || code.length !== 6) {
        showMessage(twoFAMessage, '6 haneli kodu tam olarak girin');
        return;
    }

    verifyBtn.innerHTML = 'Doğrulanıyor...';
    verifyBtn.disabled = true;

    try {
        // Önce kullanıcının email adresini alalım
        const userResponse: Response = await fetch(`${API_BASE_URL}/user/profile?username=${username}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!userResponse.ok) {
            throw new Error('Kullanıcı bilgileri alınamadı');
        }

        const userData: any = await userResponse.json();
        const email: string = userData.email;

        // 2FA doğrulaması yap
        const response: Response = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code }),
        });

        const data: LoginData = await response.json();

        if (response.ok && data.success === 'true') {
            // Token'ı kaydet ve ana sayfaya yönlendir
            localStorage.setItem('token', data.token!);
            localStorage.setItem('username', username);
            showMessage(twoFAMessage, 'Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
            setTimeout((): void => {
                showDashboard();
            }, 1500);
        } else {
            showMessage(twoFAMessage, data.error || 'Doğrulama kodu hatalı');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(twoFAMessage, 'Doğrulama sırasında hata oluştu');
    } finally {
        verifyBtn.innerHTML = 'Doğrula';
        verifyBtn.disabled = false;
    }
});

function showDashboard(): void {
    const username: string | null = localStorage.getItem('username');
    const userEmail: string | null = localStorage.getItem('userEmail');
    twoFASection.classList.add('hidden');
    registerSection.classList.add('hidden');
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    
    // Ana sayfada tüm bölümleri gizle
    hideAllSections();
    
    let welcomeText: string = `Merhaba ${username}! 🚀`;
    if (userEmail) {
        welcomeText += `<br><small style="color: #ccc;">📧 ${userEmail}</small>`;
    }
    
    // Admin kullanıcısı için özel mesaj
    if (isCurrentUserAdmin()) {
        welcomeText += `<br><span style="color: #ffd93d;">👑 Admin Paneli</span>`;
    }
    
    welcomeMessage.innerHTML = welcomeText;
    
    // Kullanıcılar butonunu yalnızca admin görebilir
    updateUsersButtonVisibility();
    
    // İlk kez açıldığında örnek yorumları ekle
    initializeSampleComments();
}

function updateUsersButtonVisibility(): void {
    const usersButton = document.querySelector('[onclick="showRegisteredUsers()"]') as HTMLElement;
    if (usersButton) {
        if (isCurrentUserAdmin()) {
            usersButton.style.display = 'inline-block';
        } else {
            usersButton.style.display = 'none';
        }
    }
}

function initializeSampleComments(): void {
    const existingComments: string | null = localStorage.getItem('comments');
    if (!existingComments) {
        const sampleComments: UserComment[] = [
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
                likedBy: ['testuser', 'Demo User', 'alice']
            },
            {
                id: 3,
                author: 'Demo User',
                text: 'İlk yorumum! Bu sistem gerçekten kullanışlı görünüyor. 👍',
                date: new Date(Date.now() - 10800000).toISOString(),
                likes: 2,
                likedBy: ['testuser', 'Admin']
            }
        ];
        localStorage.setItem('comments', JSON.stringify(sampleComments));
    }
}

function logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    dashboardSection.classList.add('hidden');
    twoFASection.classList.add('hidden');
    registerSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    
    // Formu temizle
    (document.getElementById('username') as HTMLInputElement).value = '';
    (document.getElementById('password') as HTMLInputElement).value = '';
    (document.getElementById('regUsername') as HTMLInputElement).value = '';
    (document.getElementById('regEmail') as HTMLInputElement).value = '';
    (document.getElementById('regPassword') as HTMLInputElement).value = '';
    (document.getElementById('verificationCode') as HTMLInputElement).value = '';
    loginMessage.innerHTML = '';
    registerMessage.innerHTML = '';
    twoFAMessage.innerHTML = '';
}

// Comment system functions
function showComments(): void {
    hideAllSections();
    document.getElementById('commentsSection')!.classList.remove('hidden');
    loadComments();
    
    const currentUser: string | null = localStorage.getItem('username');
    const commentForm: HTMLElement = document.querySelector('.comment-form') as HTMLElement;
    
    // Eğer kullanıcı giriş yapmamışsa yorum formunu gizle
    if (!currentUser) {
        commentForm.innerHTML = `
            <div style="text-align: center; padding: 20px; background: rgba(255,0,0,0.1); border-radius: 8px; border: 1px solid #e74c3c;">
                <p style="color: #e74c3c; margin: 0;">🔒 Yorum yapabilmek için giriş yapmanız gerekiyor!</p>
            </div>
        `;
        return;
    }
    
    // Kullanıcı giriş yaptıysa normal yorum formunu göster
    commentForm.innerHTML = `
        <textarea id="commentInput" class="comment-input" placeholder="Yorumunuzu buraya yazın... (Ctrl+Enter ile hızlı gönder)" maxlength="500"></textarea>
        <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span id="charCounter" style="color: #ccc; font-size: 12px;">0/500</span>
            <button onclick="addComment()" class="submit-btn" style="background: #27ae60; width: auto; padding: 8px 20px;">📝 Yorum Gönder</button>
        </div>
    `;
    
    // Karakter sayacını başlat
    const commentInput: HTMLTextAreaElement | null = document.getElementById('commentInput') as HTMLTextAreaElement;
    const charCounter: HTMLElement | null = document.getElementById('charCounter') as HTMLElement;
    
    if (commentInput && charCounter) {
        commentInput.addEventListener('input', function(): void {
            const length: number = this.value.length;
            charCounter.textContent = `${length}/500`;
            charCounter.style.color = length > 450 ? '#e74c3c' : '#ccc';
        });
        
        // Enter + Ctrl ile yorum gönder
        commentInput.addEventListener('keydown', function(e: KeyboardEvent): void {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                addComment();
            }
        });
    }
}

function hideAllSections(): void {
    document.getElementById('commentsSection')!.classList.add('hidden');
    document.getElementById('usersList')!.classList.add('hidden');
}

function addComment(): void {
    const commentInput: HTMLTextAreaElement = document.getElementById('commentInput') as HTMLTextAreaElement;
    const commentText: string = commentInput.value.trim();
    const currentUser: string | null = localStorage.getItem('username');
    
    // Kullanıcı girişi kontrolü
    if (!currentUser) {
        alert('Yorum yapabilmek için giriş yapmanız gerekiyor!');
        return;
    }
    
    if (!commentText) {
        alert('Lütfen bir yorum yazın!');
        return;
    }
    
    if (commentText.length > 500) {
        alert('Yorum 500 karakterden uzun olamaz!');
        return;
    }
    
    // Yeni yorum objesi oluştur
    const newComment: UserComment = {
        id: Date.now(),
        author: currentUser,
        text: commentText,
        date: new Date().toISOString(),
        likes: 0,
        likedBy: []
    };
    
    // Mevcut yorumları al
    const comments: UserComment[] = JSON.parse(localStorage.getItem('comments') || '[]');
    
    // Yeni yorumu en başa ekle
    comments.unshift(newComment);
    
    // Yorumları kaydet
    localStorage.setItem('comments', JSON.stringify(comments));
    
    // Formu temizle
    commentInput.value = '';
    (document.getElementById('charCounter') as HTMLElement).textContent = '0/500';
    
    // Yorumları yeniden yükle
    loadComments();
    
    // Başarı mesajı
    showCommentMessage('Yorumunuz başarıyla eklendi! 🎉', 'success');
}

function loadComments(): void {
    const comments: UserComment[] = JSON.parse(localStorage.getItem('comments') || '[]');
    const commentsList: HTMLElement = document.getElementById('commentsList') as HTMLElement;
    const currentUser: string | null = localStorage.getItem('username');
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="no-comments">🤔 Henüz yorum yapılmamış. İlk yorumu sen yap!</div>';
        return;
    }
    
    let commentsHtml: string = '';
    comments.forEach((comment: UserComment): void => {
        const commentDate: Date = new Date(comment.date);
        const timeAgo: string = getTimeAgo(commentDate);
        
        // Beğeni durumunu kontrol et
        const likedBy: string[] = comment.likedBy || [];
        const isLikedByCurrentUser: boolean = currentUser ? likedBy.includes(currentUser) : false;
        const likeButtonText: string = isLikedByCurrentUser ? '💖 Beğendin' : '❤️ Beğen';
        const likeButtonStyle: string = isLikedByCurrentUser ? 
            'background: #e74c3c; color: white; padding: 4px 8px; border-radius: 3px;' : 
            'background: none; border: none; color: #e74c3c; cursor: pointer;';
        
        // Eğer kullanıcı giriş yapmamışsa beğeni butonunu gizle
        const likeButton: string = currentUser ? 
            `<button onclick="likeComment(${comment.id})" style="${likeButtonStyle} font-size: 12px;" ${isLikedByCurrentUser ? 'disabled' : ''}>
                ${likeButtonText} (${comment.likes})
            </button>` : 
            `<span style="color: #e74c3c; font-size: 12px;">❤️ ${comment.likes} Beğeni</span>`;
        
        commentsHtml += `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">👤 ${comment.author}</span>
                    <span class="comment-date">🕒 ${timeAgo}</span>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
                <div style="margin-top: 8px;">
                    ${likeButton}
                </div>
            </div>
        `;
    });
    
    commentsList.innerHTML = commentsHtml;
}

function likeComment(commentId: number): void {
    const currentUser: string | null = localStorage.getItem('username');
    
    // Kullanıcı girişi kontrolü
    if (!currentUser) {
        alert('Beğeni yapabilmek için giriş yapmanız gerekiyor!');
        return;
    }
    
    const comments: UserComment[] = JSON.parse(localStorage.getItem('comments') || '[]');
    const comment: UserComment | undefined = comments.find((c: UserComment) => c.id === commentId);
    
    if (!comment) {
        return;
    }
    
    // likedBy array'i yoksa oluştur
    if (!comment.likedBy) {
        comment.likedBy = [];
    }
    
    // Kullanıcı daha önce beğenmiş mi kontrol et
    if (comment.likedBy.includes(currentUser)) {
        showCommentMessage('Bu yorumu zaten beğenmişsiniz! 😊', 'info');
        return;
    }
    
    // Beğeniyi ekle
    comment.likes = (comment.likes || 0) + 1;
    comment.likedBy.push(currentUser);
    
    // Değişiklikleri kaydet
    localStorage.setItem('comments', JSON.stringify(comments));
    
    // Yorumları yeniden yükle
    loadComments();
    
    // Başarı mesajı
    showCommentMessage('Yorumu beğendiniz! ❤️', 'success');
}

function getTimeAgo(date: Date): string {
    const now: Date = new Date();
    const diffInSeconds: number = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    
    return date.toLocaleDateString('tr-TR');
}

function escapeHtml(text: string): string {
    const div: HTMLDivElement = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showCommentMessage(message: string, type: string = 'success'): void {
    const messageDiv: HTMLDivElement = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.background = type === 'success' ? '#27ae60' : type === 'info' ? '#3498db' : '#e74c3c';
    messageDiv.style.color = 'white';
    messageDiv.style.padding = '10px 20px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    
    document.body.appendChild(messageDiv);
    
    setTimeout((): void => {
        if (document.body.contains(messageDiv)) {
            document.body.removeChild(messageDiv);
        }
    }, 3000);
}

async function showRegisteredUsers(): Promise<void> {
    // Admin kontrolü
    if (!isCurrentUserAdmin()) {
        // Floating message oluştur
        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = 'Bu özelliğe sadece admin kullanıcıları erişebilir! 🔒';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(messageDiv);
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, 3000);
        return;
    }
    
    hideAllSections();
    const usersList: HTMLElement = document.getElementById('usersList') as HTMLElement;
    const usersContent: HTMLElement = document.getElementById('usersContent') as HTMLElement;
    
    // Loading mesajı
    usersContent.innerHTML = '<p style="color: #ccc;">Kullanıcılar yükleniyor...</p>';
    usersList.classList.remove('hidden');
    
    try {
        // Backend'den kullanıcıları al
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/user/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            displayBackendUsers(data.users);
        } else {
            throw new Error('Backend kullanıcıları alınamadı');
        }
    } catch (error) {
        console.error('Error fetching backend users:', error);
        // Fallback: Yerel kullanıcıları göster
        displayLocalUsers();
    }
}

function displayBackendUsers(backendUsers: any[]): void {
    const usersContent: HTMLElement = document.getElementById('usersContent') as HTMLElement;
    const currentUsername = localStorage.getItem('username');
    
    if (backendUsers.length === 0) {
        usersContent.innerHTML = '<p style="color: #ccc;">Henüz kayıtlı kullanıcı yok.</p>';
        return;
    }
    
    let usersHtml = '<h4 style="color: #ffd93d; margin-bottom: 10px;">🌐 Backend Kullanıcıları:</h4>';
    backendUsers.forEach((user: any, index: number): void => {
        const createdDate = new Date(user.created_at).toLocaleString('tr-TR');
        const lastActiveDate = user.last_active ? new Date(user.last_active).toLocaleString('tr-TR') : 'Hiç';
        const isCurrentUser = user.username === currentUsername;
        const userClass = isCurrentUser ? 'style="background: rgba(52, 152, 219, 0.3); border: 1px solid #3498db;"' : '';
        
        usersHtml += `
            <div ${userClass} style="background: rgba(255,255,255,0.1); padding: 10px; margin: 5px 0; border-radius: 5px;">
                <strong style="color: #4CAF50;">${index + 1}. ${user.username}</strong>
                ${isCurrentUser ? '<span style="color: #3498db; font-size: 12px;"> (Sen)</span>' : ''}
                <br>
                <small style="color: #ccc;">🆔 ID: ${user.id}</small><br>
                <small style="color: #ccc;">📊 Durum: ${user.status || 'Aktif değil'}</small><br>
                <small style="color: #ccc;">🎮 Oynanan Maç: ${user.matches_played || 0}</small><br>
                <small style="color: #ccc;">🏆 Kazanılan Maç: ${user.matches_won || 0}</small><br>
                <small style="color: #ffd93d;">📅 Kayıt: ${createdDate}</small><br>
                <small style="color: #ccc;">⏰ Son Aktiflik: ${lastActiveDate}</small>
            </div>
        `;
    });
    
    usersContent.innerHTML = usersHtml;
}

function displayLocalUsers(): void {
    const usersContent: HTMLElement = document.getElementById('usersContent') as HTMLElement;
    const registeredUsers: User[] = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    let usersHtml = '<h4 style="color: #ffd93d; margin-bottom: 10px;">💾 Yerel Kullanıcılar:</h4>';
    
    if (registeredUsers.length === 0) {
        usersHtml += '<p style="color: #ccc;">Henüz yerel kayıtlı kullanıcı yok.</p>';
    } else {
        registeredUsers.forEach((user: User, index: number): void => {
            const registeredDate: string = new Date(user.registeredAt).toLocaleString('tr-TR');
            const isCurrentUser: boolean = user.username === localStorage.getItem('username');
            const userClass: string = isCurrentUser ? 'style="background: rgba(52, 152, 219, 0.3); border: 1px solid #3498db;"' : '';
            
            usersHtml += `
                <div ${userClass} style="background: rgba(255,255,255,0.1); padding: 10px; margin: 5px 0; border-radius: 5px;">
                    <strong style="color: #4CAF50;">${index + 1}. ${user.username}</strong>
                    ${isCurrentUser ? '<span style="color: #3498db; font-size: 12px;"> (Sen)</span>' : ''}
                    <br>
                    <small style="color: #ccc;">� ${user.email}</small><br>
                    <small style="color: #ffd93d;">� ${registeredDate}</small>
                </div>
            `;
        });
    }
    
    usersContent.innerHTML = usersHtml;
}

function hideRegisteredUsers(): void {
    document.getElementById('usersList')!.classList.add('hidden');
}

// Page load token check
window.addEventListener('load', (): void => {
    const token: string | null = localStorage.getItem('token');
    if (token) {
        showDashboard();
    }
});

// Pong Game TypeScript Implementation
interface Position {
    x: number;
    y: number;
}

interface Size {
    width: number;
    height: number;
}

interface Player {
    position: Position;
    size: Size;
    speed: number;
    score: number;
    color: string;
}

interface Ball {
    position: Position;
    velocity: Position;
    size: number;
    speed: number;
    color: string;
}

interface GameState {
    isRunning: boolean;
    isPaused: boolean;
    gameStarted: boolean;
    winner: string | null;
}

class PongGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameState: GameState;
    private leftPlayer: Player;
    private rightPlayer: Player;
    private ball: Ball;
    private keys: { [key: string]: boolean };
    private animationId: number | null;
    private readonly WINNING_SCORE: number = 5;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas with id '${canvasId}' not found`);
        }
        
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        if (!this.ctx) {
            throw new Error('Failed to get 2D rendering context');
        }

        this.keys = {};
        this.animationId = null;

        this.initializeGame();
        this.setupEventListeners();
    }

    private initializeGame(): void {
        // Game state
        this.gameState = {
            isRunning: false,
            isPaused: false,
            gameStarted: false,
            winner: null
        };

        // Left player (Player 1)
        this.leftPlayer = {
            position: { x: 20, y: this.canvas.height / 2 - 50 },
            size: { width: 10, height: 100 },
            speed: 5,
            score: 0,
            color: '#ffffff'
        };

        // Right player (Player 2)
        this.rightPlayer = {
            position: { x: this.canvas.width - 30, y: this.canvas.height / 2 - 50 },
            size: { width: 10, height: 100 },
            speed: 5,
            score: 0,
            color: '#ffffff'
        };

        // Ball
        this.ball = {
            position: { x: this.canvas.width / 2, y: this.canvas.height / 2 },
            velocity: { x: 3, y: 2 },
            size: 8,
            speed: 3,
            color: '#ffffff'
        };

        this.updateScoreDisplay();
        this.updateGameStatus('Oyunu başlatmak için "Oyunu Başlat" butonuna basın');
    }

    private setupEventListeners(): void {
        // Keyboard event listeners
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (e: KeyboardEvent) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    private updatePlayers(): void {
        // Left player controls (W/S)
        if (this.keys['w'] && this.leftPlayer.position.y > 0) {
            this.leftPlayer.position.y -= this.leftPlayer.speed;
        }
        if (this.keys['s'] && this.leftPlayer.position.y < this.canvas.height - this.leftPlayer.size.height) {
            this.leftPlayer.position.y += this.leftPlayer.speed;
        }

        // Right player controls (Arrow keys)
        if (this.keys['arrowup'] && this.rightPlayer.position.y > 0) {
            this.rightPlayer.position.y -= this.rightPlayer.speed;
        }
        if (this.keys['arrowdown'] && this.rightPlayer.position.y < this.canvas.height - this.rightPlayer.size.height) {
            this.rightPlayer.position.y += this.rightPlayer.speed;
        }
    }

    private updateBall(): void {
        // Move ball
        this.ball.position.x += this.ball.velocity.x;
        this.ball.position.y += this.ball.velocity.y;

        // Ball collision with top and bottom walls
        if (this.ball.position.y <= this.ball.size || this.ball.position.y >= this.canvas.height - this.ball.size) {
            this.ball.velocity.y = -this.ball.velocity.y;
        }

        // Ball collision with left paddle
        if (this.ball.position.x <= this.leftPlayer.position.x + this.leftPlayer.size.width &&
            this.ball.position.y >= this.leftPlayer.position.y &&
            this.ball.position.y <= this.leftPlayer.position.y + this.leftPlayer.size.height) {
            this.ball.velocity.x = Math.abs(this.ball.velocity.x);
            // Add some randomness to the ball direction
            this.ball.velocity.y += (Math.random() - 0.5) * 2;
        }

        // Ball collision with right paddle
        if (this.ball.position.x >= this.rightPlayer.position.x - this.ball.size &&
            this.ball.position.y >= this.rightPlayer.position.y &&
            this.ball.position.y <= this.rightPlayer.position.y + this.rightPlayer.size.height) {
            this.ball.velocity.x = -Math.abs(this.ball.velocity.x);
            // Add some randomness to the ball direction
            this.ball.velocity.y += (Math.random() - 0.5) * 2;
        }

        // Ball out of bounds (scoring)
        if (this.ball.position.x < 0) {
            this.rightPlayer.score++;
            this.resetBall();
            this.updateScoreDisplay();
            this.checkWinner();
        } else if (this.ball.position.x > this.canvas.width) {
            this.leftPlayer.score++;
            this.resetBall();
            this.updateScoreDisplay();
            this.checkWinner();
        }
    }

    private resetBall(): void {
        this.ball.position.x = this.canvas.width / 2;
        this.ball.position.y = this.canvas.height / 2;
        // Random direction
        this.ball.velocity.x = (Math.random() > 0.5 ? 1 : -1) * this.ball.speed;
        this.ball.velocity.y = (Math.random() - 0.5) * 4;
    }

    private checkWinner(): void {
        if (this.leftPlayer.score >= this.WINNING_SCORE) {
            this.gameState.winner = 'Oyuncu 1';
            this.gameState.isRunning = false;
            this.updateGameStatus('🎉 Oyuncu 1 Kazandı! Oyun bitti.');
        } else if (this.rightPlayer.score >= this.WINNING_SCORE) {
            this.gameState.winner = 'Oyuncu 2';
            this.gameState.isRunning = false;
            this.updateGameStatus('🎉 Oyuncu 2 Kazandı! Oyun bitti.');
        }
    }

    private drawPlayer(player: Player): void {
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(player.position.x, player.position.y, player.size.width, player.size.height);
    }

    private drawBall(): void {
        this.ctx.fillStyle = this.ball.color;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.position.x, this.ball.position.y, this.ball.size, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private drawCenterLine(): void {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    private render(): void {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw center line
        this.drawCenterLine();

        // Draw players
        this.drawPlayer(this.leftPlayer);
        this.drawPlayer(this.rightPlayer);

        // Draw ball
        this.drawBall();
    }

    private gameLoop(): void {
        if (!this.gameState.isRunning || this.gameState.isPaused) {
            return;
        }

        this.updatePlayers();
        this.updateBall();
        this.render();

        if (this.gameState.isRunning) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    private updateScoreDisplay(): void {
        const leftScoreElement = document.getElementById('leftScore');
        const rightScoreElement = document.getElementById('rightScore');
        
        if (leftScoreElement) {
            leftScoreElement.textContent = `Oyuncu 1: ${this.leftPlayer.score}`;
        }
        if (rightScoreElement) {
            rightScoreElement.textContent = `Oyuncu 2: ${this.rightPlayer.score}`;
        }
    }

    private updateGameStatus(message: string): void {
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    public start(): void {
        if (!this.gameState.gameStarted) {
            this.gameState.gameStarted = true;
            this.updateGameStatus('Oyun başladı! İyi eğlenceler! 🚀');
        }
        
        this.gameState.isRunning = true;
        this.gameState.isPaused = false;
        this.gameLoop();
    }

    public pause(): void {
        this.gameState.isPaused = !this.gameState.isPaused;
        if (!this.gameState.isPaused && this.gameState.isRunning) {
            this.updateGameStatus('Oyun devam ediyor...');
            this.gameLoop();
        } else {
            this.updateGameStatus('Oyun duraklatıldı ⏸️');
        }
    }

    public reset(): void {
        this.gameState.isRunning = false;
        this.gameState.isPaused = false;
        this.gameState.gameStarted = false;
        this.gameState.winner = null;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.initializeGame();
        this.render();
    }

    public destroy(): void {
        this.gameState.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Global Pong game functions
interface WindowWithPong extends Window {
    pongGame: PongGame | null;
    showPongGame: () => void;
    startPongGame: () => void;
    pausePongGame: () => void;
    resetPongGame: () => void;
}

const globalWindow = window as unknown as WindowWithPong;

globalWindow.pongGame = null;

globalWindow.showPongGame = (): void => {
    // Hide all sections first
    document.getElementById('commentsSection')?.classList.add('hidden');
    document.getElementById('usersList')?.classList.add('hidden');
    
    // Show Pong game section
    const pongSection = document.getElementById('pongGameSection');
    if (pongSection) {
        pongSection.classList.remove('hidden');
    }
    
    // Initialize Pong game if not already done
    if (!globalWindow.pongGame) {
        try {
            globalWindow.pongGame = new PongGame('pongCanvas');
        } catch (error) {
            console.error('Error initializing Pong game:', error);
            const statusElement = document.getElementById('gameStatus');
            if (statusElement) {
                statusElement.textContent = 'Oyun yüklenirken hata oluştu!';
            }
        }
    }
};

globalWindow.startPongGame = (): void => {
    if (globalWindow.pongGame) {
        globalWindow.pongGame.start();
    }
};

globalWindow.pausePongGame = (): void => {
    if (globalWindow.pongGame) {
        globalWindow.pongGame.pause();
    }
};

globalWindow.resetPongGame = (): void => {
    if (globalWindow.pongGame) {
        globalWindow.pongGame.reset();
    }
};
