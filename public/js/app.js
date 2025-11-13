// Configurações da API
const API_BASE_URL = 'http://localhost:3000/api';

// Disponibilizar globalmente
window.API_BASE_URL = API_BASE_URL;
window.showError = Utils.showError.bind(Utils);
window.showSuccess = Utils.showSuccess.bind(Utils);

// Estado da aplicação
const AppState = {
    user: null,
    currentPage: 'dashboard',
    token: localStorage.getItem('authToken'),
    accounts: [],
    categories: [],
    transactions: [],
    dashboardData: null
};

// Utilitários
const Utils = {
    formatCurrency(value) {
        const number = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(number || 0);
    },

    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR');
    },

    formatDateTime(date) {
        const d = new Date(date);
        return d.toLocaleString('pt-BR');
    },

    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Carregando...</div>';
        }
    },

    showError(message) {
        // Criar notificação de erro
        this.createNotification(message, 'error');
    },

    showSuccess(message) {
        // Criar notificação de sucesso
        this.createNotification(message, 'success');
    },

    createNotification(message, type) {
        // Remover notificações existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Adicionar estilos se não existirem
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease-out;
                }
                .notification-success {
                    background: #d4edda;
                    border: 1px solid #c3e6cb;
                    color: #155724;
                }
                .notification-error {
                    background: #f8d7da;
                    border: 1px solid #f5c6cb;
                    color: #721c24;
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    gap: 8px;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    margin-left: auto;
                    padding: 4px;
                    border-radius: 4px;
                }
                .notification-close:hover {
                    background: rgba(0,0,0,0.1);
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Adicionar ao DOM
        document.body.appendChild(notification);

        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// API Client
const ApiClient = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (AppState.token) {
            config.headers.Authorization = `Bearer ${AppState.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    async getProfile() {
        return this.request('/auth/profile');
    },

    // Accounts endpoints
    async getAccounts() {
        return this.request('/accounts');
    },

    async createAccount(accountData) {
        return this.request('/accounts', {
            method: 'POST',
            body: JSON.stringify(accountData)
        });
    },

    async updateAccount(id, accountData) {
        return this.request(`/accounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(accountData)
        });
    },

    async deleteAccount(id) {
        return this.request(`/accounts/${id}`, {
            method: 'DELETE'
        });
    },

    async getTotalBalance() {
        return this.request('/accounts/total-balance');
    },

    // Transactions endpoints
    async getTransactions(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/transactions?${params}`);
    },

    async createTransaction(transactionData) {
        return this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
    },

    async updateTransaction(id, transactionData) {
        return this.request(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transactionData)
        });
    },

    async deleteTransaction(id) {
        return this.request(`/transactions/${id}`, {
            method: 'DELETE'
        });
    },

    // Categories endpoints
    async getCategories() {
        return this.request('/categories');
    },

    async createCategory(categoryData) {
        return this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    },

    // Dashboard endpoints
    async getDashboardData() {
        return this.request('/dashboard');
    }
};

// Navigation
const Navigation = {
    init() {
        // Set up navigation event listeners
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').replace('#', '');
                this.navigateTo(page);
            });
        });

        // Set initial page
        this.navigateTo('dashboard');
    },

    navigateTo(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[href="#${page}"]`)?.parentElement;
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Hide all content sections
        document.querySelectorAll('.content').forEach(content => {
            content.classList.add('hidden');
        });

        // Show target content
        const targetContent = document.getElementById(`${page}Content`);
        if (targetContent) {
            targetContent.classList.remove('hidden');
        }

        // Update page title
        this.updatePageTitle(page);

        // Update state
        AppState.currentPage = page;

        // Load page data
        this.loadPageData(page);
    },

    updatePageTitle(page) {
        const titles = {
            dashboard: { title: 'Dashboard', subtitle: 'Visão geral das suas finanças' },
            accounts: { title: 'Contas', subtitle: 'Gerencie suas contas bancárias' },
            transactions: { title: 'Transações', subtitle: 'Histórico de movimentações' },
            'credit-cards': { title: 'Cartões', subtitle: 'Cartões de crédito' },
            categories: { title: 'Categorias', subtitle: 'Categorias de receitas e despesas' },
            budgets: { title: 'Orçamentos', subtitle: 'Controle de gastos mensais' },
            reports: { title: 'Relatórios', subtitle: 'Análises e estatísticas' },
            import: { title: 'Importar', subtitle: 'Importar extratos e faturas' }
        };

        const pageInfo = titles[page] || { title: 'Finance Control', subtitle: '' };
        
        document.getElementById('pageTitle').textContent = pageInfo.title;
        document.getElementById('pageSubtitle').textContent = pageInfo.subtitle;
    },

    async loadPageData(page) {
        try {
            switch (page) {
                case 'dashboard':
                    await Dashboard.loadData();
                    break;
                case 'accounts':
                    await Accounts.loadData();
                    break;
                case 'transactions':
                    await Transactions.loadData();
                    break;
                // Add other pages as needed
            }
        } catch (error) {
            console.error('Error loading page data:', error);
            Utils.showError('Erro ao carregar dados da página');
        }
    }
};

// Modal Management
const Modal = {
    show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    },

    hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    },

    hideAll() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
    }
};

// Global functions for HTML onclick handlers
function closeModal(modalId) {
    Modal.hide(modalId);
}

function logout() {
    localStorage.removeItem('authToken');
    AppState.token = null;
    AppState.user = null;
    window.location.href = '/login.html';
}

function showAddTransactionModal() {
    // Populate account and category dropdowns
    populateTransactionForm();
    Modal.show('addTransactionModal');
}

function populateTransactionForm() {
    const accountSelect = document.getElementById('transactionAccount');
    const categorySelect = document.getElementById('transactionCategory');

    // Clear existing options
    accountSelect.innerHTML = '<option value="">Selecione uma conta</option>';
    categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';

    // Populate accounts
    AppState.accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = `${account.name} - ${account.bank}`;
        accountSelect.appendChild(option);
    });

    // Populate categories
    AppState.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });

    // Set default date to today
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
}

// Form handling
function setupFormHandlers() {
    // Add Transaction Form
    const addTransactionForm = document.getElementById('addTransactionForm');
    if (addTransactionForm) {
        addTransactionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(addTransactionForm);
            const transactionData = {
                accountId: document.getElementById('transactionAccount').value,
                categoryId: document.getElementById('transactionCategory').value || null,
                amount: parseFloat(document.getElementById('transactionAmount').value),
                type: document.getElementById('transactionType').value,
                description: document.getElementById('transactionDescription').value,
                date: new Date(document.getElementById('transactionDate').value).toISOString()
            };

            try {
                await ApiClient.createTransaction(transactionData);
                Utils.showSuccess('Transação criada com sucesso!');
                Modal.hide('addTransactionModal');
                
                // Reload current page data
                Navigation.loadPageData(AppState.currentPage);
                
                // Reset form
                addTransactionForm.reset();
            } catch (error) {
                Utils.showError(error.message);
            }
        });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is authenticated
    if (!AppState.token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        // Load user profile
        const userResponse = await ApiClient.getProfile();
        AppState.user = userResponse.data;
        document.getElementById('userName').textContent = AppState.user.name;

        // Load initial data
        const [accountsResponse, categoriesResponse] = await Promise.all([
            ApiClient.getAccounts(),
            ApiClient.getCategories()
        ]);

        AppState.accounts = accountsResponse.data;
        AppState.categories = categoriesResponse.data;

        // Initialize navigation
        Navigation.init();

        // Setup form handlers
        setupFormHandlers();

        // Setup modal close handlers
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Modal.hide(modal.id);
                }
            });
        });

    } catch (error) {
        console.error('Error initializing app:', error);
        Utils.showError('Erro ao carregar aplicação');
        logout();
    }
});

// Handle window resize
window.addEventListener('resize', Utils.debounce(() => {
    // Update charts if they exist
    if (window.incomeExpenseChart) {
        window.incomeExpenseChart.resize();
    }
    if (window.categoryChart) {
        window.categoryChart.resize();
    }
}, 250));
