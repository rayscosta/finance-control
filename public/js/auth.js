// Finance Control - Simple Authentication (NO AUTO-REDIRECTS)

class AuthManager {
    constructor() {
        this.baseUrl = window.API_BASE_URL || window.location.origin + '/api';
    }

    getToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    saveToken(token, rememberMe) {
        if (rememberMe) {
            localStorage.setItem('authToken', token);
            sessionStorage.removeItem('authToken');
        } else {
            sessionStorage.setItem('authToken', token);
            localStorage.removeItem('authToken');
        }
    }

    clearToken() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('userData');
    }

    isAuthenticated() {
        return Boolean(this.getToken());
    }

    setupLoginPage() {
        this.setupTabs();
        this.setupForms();
    }

    setupTabs() {
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab || (btn.textContent.includes('Entrar') ? 'login' : 'register');
                this.showTab(tab);
            });
        });
        if (buttons.length && !document.querySelector('.tab-button.active')) {
            buttons[0].classList.add('active');
            this.showTab('login');
        }
    }

    showTab(name) {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        const btn = Array.from(document.querySelectorAll('.tab-button'))
            .find(b => b.dataset.tab === name);
        if (btn) btn.classList.add('active');
        
        const content = document.getElementById(name + '-tab');
        if (content) content.classList.add('active');
    }

    setupForms() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', e => this.handleLogin(e));
        
        const registerForm = document.getElementById('registerForm');
        if (registerForm) registerForm.addEventListener('submit', e => this.handleRegister(e));
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me')?.checked || false;
        
        if (!email || !password) {
            this.showMessage('login-message', 'Preencha email e senha', 'error');
            return;
        }
        
        try {
            this.showMessage('login-message', 'Entrando...', 'info');
            const res = await fetch(this.baseUrl + '/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Erro no login');
            
            this.saveToken(data.token, rememberMe);
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('userData', JSON.stringify(data.user));
            
            this.showMessage('login-message', 'Sucesso! Redirecionando...', 'success');
            setTimeout(() => window.location.href = '/dashboard.html', 800);
        } catch (err) {
            this.showMessage('login-message', err.message, 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        
        if (!name || !email || !password) {
            this.showMessage('register-message', 'Preencha todos os campos', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('register-message', 'Senha deve ter 6+ caracteres', 'error');
            return;
        }
        
        try {
            this.showMessage('register-message', 'Criando conta...', 'info');
            const res = await fetch(this.baseUrl + '/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Erro ao criar conta');
            
            this.saveToken(data.token, false);
            sessionStorage.setItem('userData', JSON.stringify(data.user));
            
            this.showMessage('register-message', 'Conta criada! Redirecionando...', 'success');
            setTimeout(() => window.location.href = '/dashboard.html', 800);
        } catch (err) {
            this.showMessage('register-message', err.message, 'error');
        }
    }

    logout() {
        this.clearToken();
        window.location.href = '/login.html';
    }

    showMessage(id, msg, type) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = msg ? '<div class="message ' + type + '">' + msg + '</div>' : '';
        if (type === 'success') {
            setTimeout(() => { if (el.innerText.includes(msg)) el.innerHTML = ''; }, 4000);
        }
    }
}

window.authManager = new AuthManager();

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('login.html')) {
        window.authManager.setupLoginPage();
    }
});

window.logout = () => window.authManager.logout();
window.checkAuth = () => window.authManager.isAuthenticated();
