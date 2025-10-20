// Sistema de Autenticação Frontend

class AuthManager {
    constructor() {
        // Usar a variável global ou fallback para localhost:3001
        this.baseUrl = window.API_BASE_URL || 'http://localhost:3001/api';
        this.token = null;
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

        // Form de Reset de Senha
        const resetForm = document.getElementById('resetPasswordForm');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => this.handlePasswordReset(e));
        }

        // Link "Esqueceu a senha?"
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showResetPasswordModal();
            });
        }

        // Fechar modal
        const modal = document.getElementById('reset-password-modal');
        if (modal) {
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeResetPasswordModal());
            }
            
            // Fechar ao clicar fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeResetPasswordModal();
                }
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('login-message');
        
        // Dados do formulário usando IDs específicos
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me')?.checked || false;

        console.log('Tentando fazer login com:', { email, password: '***', rememberMe });

        // Validação básica
        if (!email || !password) {
            this.showMessage('login-message', 'Por favor, preencha todos os campos.', 'error');
            return;
        }

        try {
            // Loading state
            this.setButtonLoading(submitBtn, true);
            this.showMessage('login-message', 'Entrando...', 'info');

            console.log('Fazendo requisição para:', `${this.baseUrl}/auth/login`);

            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Resposta recebida:', response.status, response.statusText);

            const data = await response.json();
            console.log('Dados da resposta:', data);

            if (response.ok) {
                // Login bem-sucedido
                this.saveAuthData(data.token, data.user, rememberMe);
                this.showMessage('login-message', 'Login realizado com sucesso! Redirecionando...', 'success');
                
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 1500);
            } else {
                // Erro no login
                console.error('Erro no login:', data);
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
        
        // Dados do formulário usando IDs específicos
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        console.log('Tentando registrar com:', { name, email, password: '***' });

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

            console.log('Fazendo requisição para:', `${this.baseUrl}/auth/register`);

            const response = await fetch(`${this.baseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });

            console.log('Resposta recebida:', response.status, response.statusText);

            const data = await response.json();
            console.log('Dados da resposta:', data);

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

    showResetPasswordModal() {
        const modal = document.getElementById('reset-password-modal');
        if (modal) {
            modal.classList.add('active');
            // Limpar campo de email
            const emailInput = document.getElementById('reset-email');
            if (emailInput) emailInput.value = '';
            // Limpar mensagens
            this.showMessage('reset-message', '', '');
        }
    }

    closeResetPasswordModal() {
        const modal = document.getElementById('reset-password-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async handlePasswordReset(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const email = document.getElementById('reset-email').value;

        console.log('Tentando resetar senha para:', email);

        // Validação básica
        if (!email) {
            this.showMessage('reset-message', 'Por favor, insira seu email.', 'error');
            return;
        }

        try {
            // Loading state
            submitBtn.innerHTML = '<span class="loading"></span> Enviando...';
            submitBtn.disabled = true;
            this.showMessage('reset-message', 'Enviando instruções...', 'info');

            console.log('Fazendo requisição para:', `${this.baseUrl}/auth/forgot-password`);

            const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            console.log('Resposta recebida:', response.status, response.statusText);

            const data = await response.json();
            console.log('Dados da resposta:', data);

            if (response.ok) {
                // Sucesso
                this.showMessage('reset-message', 
                    'Instruções enviadas! Verifique seu email (também na pasta de spam).', 
                    'success'
                );
                
                // Fechar modal após 3 segundos
                setTimeout(() => {
                    this.closeResetPasswordModal();
                }, 3000);
            } else {
                // Erro
                console.error('Erro ao resetar senha:', data);
                this.showMessage('reset-message', 
                    data.message || 'Erro ao enviar instruções. Tente novamente.', 
                    'error'
                );
            }
        } catch (error) {
            console.error('Erro ao resetar senha:', error);
            this.showMessage('reset-message', 
                'Erro de conexão. Tente novamente. Detalhes: ' + error.message, 
                'error'
            );
        } finally {
            submitBtn.innerHTML = 'Enviar Instruções';
            submitBtn.disabled = false;
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
    window.authManager.init(); // Chamar o método init
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
