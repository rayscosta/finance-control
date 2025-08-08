// Sistema de Autenticação Frontend

class AuthManager {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api';
        this.token = localStorage.getItem('authToken');
        this.init();
    }

    init() {
        // Verificar se está na página de login
        if (window.location.pathname.includes('login.html')) {
            this.setupLoginPage();
        }
        
        // Verificar autenticação em outras páginas
        if (this.requiresAuth() && !this.isAuthenticated()) {
            this.redirectToLogin();
        }
    }

    setupLoginPage() {
        // Setup das tabs
        this.setupTabs();
        
        // Setup dos formulários
        this.setupForms();
        
        // Se já está logado, redirecionar
        if (this.isAuthenticated()) {
            this.redirectToDashboard();
        }
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.textContent.toLowerCase().includes('entrar') ? 'login' : 'register';
                this.showTab(tabName);
            });
        });
    }

    showTab(tabName) {
        // Remover active de todos os botões e conteúdos
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Adicionar active ao botão correto
        const activeButton = Array.from(document.querySelectorAll('.tab-button'))
            .find(btn => btn.textContent.toLowerCase().includes(tabName === 'login' ? 'entrar' : 'registrar'));
        if (activeButton) activeButton.classList.add('active');

        // Mostrar conteúdo correto
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) activeContent.classList.add('active');
    }

    setupForms() {
        // Form de Login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Form de Registro
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('login-message');
        
        // Dados do formulário
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;
        const rememberMe = form.querySelector('input[type="checkbox"]')?.checked || false;

        // Validação básica
        if (!email || !password) {
            this.showMessage('login-message', 'Por favor, preencha todos os campos.', 'error');
            return;
        }

        try {
            // Loading state
            this.setButtonLoading(submitBtn, true);
            this.showMessage('login-message', 'Entrando...', 'info');

            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Login bem-sucedido
                this.saveAuthData(data.token, data.user, rememberMe);
                this.showMessage('login-message', 'Login realizado com sucesso! Redirecionando...', 'success');
                
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 1500);
            } else {
                // Erro no login
                this.showMessage('login-message', data.message || 'Erro ao fazer login. Verifique suas credenciais.', 'error');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showMessage('login-message', 'Erro de conexão. Tente novamente.', 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Dados do formulário
        const name = form.querySelector('input[placeholder*="nome"]').value;
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;

        // Validação básica
        if (!name || !email || !password) {
            this.showMessage('register-message', 'Por favor, preencha todos os campos.', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('register-message', 'A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }
        
        // Limpar mensagens anteriores
        this.showMessage('register-message', '', '');

        try {
            // Loading state
            this.setButtonLoading(submitBtn, true);
            this.showMessage('register-message', 'Criando conta...', 'info');

            const response = await fetch(`${this.baseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Registro bem-sucedido
                this.showMessage('register-message', 'Conta criada com sucesso! Fazendo login...', 'success');
                
                // Auto-login após registro
                setTimeout(() => {
                    this.saveAuthData(data.token, data.user, false);
                    this.redirectToDashboard();
                }, 1500);
            } else {
                // Erro no registro
                console.error('Erro de registro:', data);
                this.showMessage('register-message', data.message || 'Erro ao criar conta. Tente novamente.', 'error');
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            this.showMessage('register-message', 'Erro de conexão. Tente novamente. Detalhes: ' + error.message, 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    saveAuthData(token, user, rememberMe) {
        if (rememberMe) {
            localStorage.setItem('authToken', token);
            localStorage.setItem('userData', JSON.stringify(user));
        } else {
            sessionStorage.setItem('authToken', token);
            sessionStorage.setItem('userData', JSON.stringify(user));
        }
        this.token = token;
    }

    isAuthenticated() {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        return !!token;
    }

    requiresAuth() {
        const publicPages = ['login.html', 'index.html', ''];
        const currentPage = window.location.pathname.split('/').pop();
        return !publicPages.includes(currentPage);
    }

    redirectToLogin() {
        window.location.href = '/login.html';
    }

    redirectToDashboard() {
        window.location.href = '/dashboard.html';
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userData');
        this.token = null;
        this.redirectToLogin();
    }

    showMessage(elementId, message, type) {
        const messageElement = document.getElementById(elementId);
        if (messageElement) {
            messageElement.innerHTML = `<div class="message ${type}">${message}</div>`;
            
            // Auto-hide após 5 segundos para mensagens de sucesso
            if (type === 'success') {
                setTimeout(() => {
                    messageElement.innerHTML = '';
                }, 5000);
            }
        }
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.innerHTML = '<span class="loading"></span> Entrando...';
            button.disabled = true;
        } else {
            button.innerHTML = button.textContent.includes('Registrar') ? 'Criar Conta' : 'Entrar';
            button.disabled = false;
        }
    }

    // Método para fazer requisições autenticadas
    async authenticatedFetch(url, options = {}) {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        const response = await fetch(url, mergedOptions);
        
        // Se 401, token expirado
        if (response.status === 401) {
            this.logout();
            return;
        }
        
        return response;
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Função global para logout (usada nos botões de sair)
function logout() {
    if (window.authManager) {
        window.authManager.logout();
    }
}

// Função global para verificar autenticação
function checkAuth() {
    return window.authManager ? window.authManager.isAuthenticated() : false;
}
