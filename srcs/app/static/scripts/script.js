
// Backend API URL'leri
const AUTH_SERVICE = 'https://localhost:8443/auth';
const USER_SERVICE = 'https://localhost:8443/user';

// DOM elementleri
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

let currentUserEmail = '';

// Sayfa geçiş fonksiyonları
document.getElementById('showRegisterBtn').addEventListener('click', () => {
    loginSection.classList.add('hidden');
    registerSection.classList.remove('hidden');
});

document.getElementById('showLoginBtn').addEventListener('click', () => {
    registerSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch(`${AUTH_SERVICE}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    });

    const data = await response.json();

    if (response.ok) {
        console.log("login success");
    }
});



