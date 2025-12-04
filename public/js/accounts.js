// Accounts page functionality
let currentView = 'cards';
let accounts = [];
let accountToDelete = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    if (!await ensureAuth()) return;
    
    await loadUserInfo();
    await loadAccounts();
    setupEventListeners();
});

// Função utilitária para obter o token de autenticação
function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// Setup event listeners
function setupEventListeners() {
    // View controls
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', handleViewChange);
    });
    
    // Account form
    document.getElementById('accountForm').addEventListener('submit', handleAccountSubmit);
}

// Load user information
async function loadUserInfo() {
    try {
        const token = getAuthToken();
        
        // Verificar se existe um token válido
        if (!token) {
            console.error('Token de autenticação não encontrado');
            showError('Sessão expirada. Por favor, faça login novamente.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        // Usar API_BASE_URL
        const baseUrl = window.API_BASE_URL;
        const response = await fetch(`${baseUrl}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('userName').textContent = data.data.name;
            document.getElementById('userEmail').textContent = data.data.email;
        } else {
            // Verificar se é um erro de autenticação
            if (response.status === 401) {
                showError('Sessão expirada. Por favor, faça login novamente.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            
            console.error(`Erro ao carregar informações do usuário: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load accounts
async function loadAccounts() {
    try {
        const token = getAuthToken();
        
        // Verificar se existe um token válido
        if (!token) {
            console.error('Token de autenticação não encontrado');
            showError('Sessão expirada. Por favor, faça login novamente.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        // Usar API_BASE_URL
        const baseUrl = window.API_BASE_URL;
        const response = await fetch(`${baseUrl}/accounts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            accounts = data.data || [];
            
            updateAccountStats();
            renderAccounts();
        } else {
            // Verificar se é um erro de autenticação
            if (response.status === 401) {
                showError('Sessão expirada. Por favor, faça login novamente.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            
            console.error(`Erro ao carregar contas: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
}

// Update account statistics
function updateAccountStats() {
    const stats = {
        checking: 0,
        savings: 0,
        credit: 0,
        investment: 0
    };
    
    accounts.forEach(account => {
        switch (account.type) {
            case 'CHECKING':
                stats.checking += account.balance;
                break;
            case 'SAVINGS':
                stats.savings += account.balance;
                break;
            case 'CREDIT':
                stats.credit += account.balance;
                break;
            case 'INVESTMENT':
                stats.investment += account.balance;
                break;
        }
    });
    
    document.getElementById('totalChecking').textContent = formatCurrency(stats.checking);
    document.getElementById('totalSavings').textContent = formatCurrency(stats.savings);
    document.getElementById('totalCredit').textContent = formatCurrency(stats.credit);
    document.getElementById('totalInvestment').textContent = formatCurrency(stats.investment);
}

// Render accounts based on current view
function renderAccounts() {
    const container = document.getElementById('accountsContainer');
    
    if (accounts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-credit-card"></i>
                <h3>Nenhuma conta encontrada</h3>
                <p>Comece adicionando sua primeira conta bancária</p>
                <button class="btn btn-primary" onclick="openAccountModal()">
                    <i class="fas fa-plus"></i>
                    Adicionar Conta
                </button>
            </div>
        `;
        return;
    }
    
    if (currentView === 'cards') {
        renderAccountsGrid();
    } else {
        renderAccountsTable();
    }
}

// Render accounts as cards
function renderAccountsGrid() {
    const container = document.getElementById('accountsContainer');
    
    container.innerHTML = `
        <div class="accounts-grid">
            ${accounts.map(account => `
                <div class="account-card ${account.type.toLowerCase()}">
                    <div class="account-header">
                        <div class="account-info">
                            <h3 class="account-name">${account.name}</h3>
                            <p class="account-type">${getAccountTypeLabel(account.type)}</p>
                        </div>
                        <div class="account-actions">
                            <button class="action-btn edit" onclick="editAccount(${account.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteAccount(${account.id})" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="account-balance ${account.balance < 0 ? 'negative' : ''}">${formatCurrency(account.balance)}</div>
                    ${account.description ? `<div class="account-description">${account.description}</div>` : ''}
                    <div class="account-stats">
                        <div class="account-stat">
                            <p class="value">0</p>
                            <p class="label">Transações</p>
                        </div>
                        <div class="account-stat">
                            <p class="value">${formatCurrency(0)}</p>
                            <p class="label">Este mês</p>
                        </div>
                        <div class="account-stat">
                            <p class="value">${new Date(account.createdAt).toLocaleDateString('pt-BR')}</p>
                            <p class="label">Criada em</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Render accounts as table
function renderAccountsTable() {
    const container = document.getElementById('accountsContainer');
    
    container.innerHTML = `
        <table class="accounts-table">
            <thead>
                <tr>
                    <th>Conta</th>
                    <th>Tipo</th>
                    <th>Saldo</th>
                    <th>Descrição</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${accounts.map(account => `
                    <tr>
                        <td>
                            <div class="table-account-info">
                                <div class="table-account-icon ${account.type.toLowerCase()}">
                                    <i class="fas ${getAccountIcon(account.type)}"></i>
                                </div>
                                <div class="table-account-details">
                                    <h4>${account.name}</h4>
                                    <p>Criada em ${new Date(account.createdAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>
                        </td>
                        <td>${getAccountTypeLabel(account.type)}</td>
                        <td class="table-balance ${account.balance < 0 ? 'negative' : ''}">${formatCurrency(account.balance)}</td>
                        <td>${account.description || '-'}</td>
                        <td>
                            <div class="table-actions">
                                <button class="action-btn edit" onclick="editAccount(${account.id})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete" onclick="deleteAccount(${account.id})" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Handle view change
function handleViewChange(e) {
    const newView = e.target.dataset.view;
    if (newView === currentView) return;
    
    // Update active state
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    currentView = newView;
    renderAccounts();
}

// Open account modal
function openAccountModal(accountId = null) {
    const modal = document.getElementById('accountModal');
    const title = document.getElementById('accountModalTitle');
    const form = document.getElementById('accountForm');
    
    if (accountId) {
        // Edit mode
        const account = accounts.find(a => a.id === accountId);
        if (!account) return;
        
        title.textContent = 'Editar Conta';
        document.getElementById('accountId').value = account.id;
        document.getElementById('accountName').value = account.name;
        
        // Selecionar o tipo correto usando radio buttons
        const typeRadio = document.querySelector(`input[name="type"][value="${account.type}"]`);
        if (typeRadio) typeRadio.checked = true;
        
        document.getElementById('accountBalance').value = account.balance;
        document.getElementById('accountDescription').value = account.description || '';
    } else {
        // Create mode
        title.textContent = 'Nova Conta';
        form.reset();
        document.getElementById('accountId').value = '';
        
        // Definir Conta Corrente como default
        const defaultTypeRadio = document.querySelector('input[name="type"][value="CHECKING"]');
        if (defaultTypeRadio) defaultTypeRadio.checked = true;
    }
    
    showModal('accountModal');
}

// Handle account form submission
async function handleAccountSubmit(e) {
    e.preventDefault();
    console.log('Form submitted!', e);
    
    const formData = new FormData(e.target);
    const accountId = formData.get('id');
    
    // Validação do formulário
    const name = formData.get('name');
    if (!name || name.trim() === '') {
        showError('O nome da conta é obrigatório');
        return;
    }
    
    const type = formData.get('type');
    if (!type) {
        showError('O tipo de conta é obrigatório');
        return;
    }
    
    // Garantir que o valor do balanço seja tratado corretamente
    let balance = formData.get('balance');
    if (balance) {
        // Converter vírgula para ponto (formato brasileiro para internacional)
        balance = balance.replace(',', '.');
        balance = parseFloat(balance);
        // Verificar se é um número válido
        if (isNaN(balance)) {
            showError('O valor do saldo deve ser um número válido');
            return;
        }
    } else {
        balance = 0;
    }
    
    const data = {
        name: formData.get('name'),
        type: formData.get('type'),
        balance: balance,
        description: formData.get('description') || null
    };
    
    console.log('Account data to submit:', data);
    
    try {
        const token = getAuthToken();
        console.log('Auth token:', token ? 'exists' : 'missing');
        
        // Verificar se existe um token válido
        if (!token) {
            console.error('Token de autenticação não encontrado');
            showError('Sessão expirada. Por favor, faça login novamente.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        // Depurar valores enviados
        console.log('Dados a serem enviados:', JSON.stringify(data));
        console.log('ID da conta:', accountId ? accountId : 'Nova conta');
        
        // Usar API_BASE_URL
        const baseUrl = window.API_BASE_URL;
        const url = accountId ? `${baseUrl}/accounts/${accountId}` : `${baseUrl}/accounts`;
        const method = accountId ? 'PUT' : 'POST';
        
        console.log('Making request to:', url, 'with method:', method);
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Success response:', result);
            closeModal('accountModal');
            await loadAccounts();
            showSuccess(accountId ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!');
        } else {
            // Verificar se é um erro de autenticação
            if (response.status === 401) {
                showError('Sessão expirada. Por favor, faça login novamente.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            
            // Tentar analisar a resposta como JSON, com fallback para texto se falhar
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const text = await response.text();
                    if (text) {
                        const error = JSON.parse(text);
                        console.error('Error response:', error);
                        showError(error.message || `Erro ao salvar conta (${response.status})`);
                    } else {
                        console.error('Empty error response');
                        showError(`Erro ao salvar conta (${response.status}): Resposta vazia`);
                    }
                } else {
                    const text = await response.text();
                    console.error('Error response (text):', text || 'No content');
                    showError(`Erro ao salvar conta (${response.status}): ${text || 'Sem detalhes'}`);
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
                showError(`Erro ao salvar conta (${response.status}): Não foi possível ler a resposta`);
            }
        }
    } catch (error) {
        console.error('Error saving account:', error);
        showError('Erro ao salvar conta. Detalhes: ' + (error.message || 'Erro desconhecido'));
    }
}

// Edit account
function editAccount(accountId) {
    openAccountModal(accountId);
}

// Delete account
function deleteAccount(accountId) {
    accountToDelete = accountId;
    showModal('deleteModal');
}

// Confirm delete
async function confirmDelete() {
    if (!accountToDelete) return;
    
    try {
        const token = getAuthToken();
        
        // Verificar se existe um token válido
        if (!token) {
            console.error('Token de autenticação não encontrado');
            showError('Sessão expirada. Por favor, faça login novamente.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        // Usar API_BASE_URL
        const baseUrl = window.API_BASE_URL;
        const response = await fetch(`${baseUrl}/accounts/${accountToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            closeModal('deleteModal');
            await loadAccounts();
            showSuccess('Conta excluída com sucesso!');
        } else {
            // Verificar se é um erro de autenticação
            if (response.status === 401) {
                showError('Sessão expirada. Por favor, faça login novamente.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            
            // Tentar analisar a resposta como JSON, com fallback para texto se falhar
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const text = await response.text();
                    if (text) {
                        const error = JSON.parse(text);
                        console.error('Error response:', error);
                        showError(error.message || `Erro ao excluir conta (${response.status})`);
                    } else {
                        console.error('Empty error response');
                        showError(`Erro ao excluir conta (${response.status}): Resposta vazia`);
                    }
                } else {
                    const text = await response.text();
                    console.error('Error response (text):', text || 'No content');
                    showError(`Erro ao excluir conta (${response.status}): ${text || 'Sem detalhes'}`);
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
                showError(`Erro ao excluir conta (${response.status}): Não foi possível ler a resposta`);
            }
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showError('Erro ao excluir conta. Detalhes: ' + (error.message || 'Erro desconhecido'));
    } finally {
        accountToDelete = null;
    }
}

// Utility functions
function getAccountIcon(type) {
    switch (type) {
        case 'CHECKING': return 'fa-university';
        case 'SAVINGS': return 'fa-piggy-bank';
        case 'CREDIT': return 'fa-credit-card';
        case 'INVESTMENT': return 'fa-chart-line';
        default: return 'fa-wallet';
    }
}

function getAccountTypeLabel(type) {
    switch (type) {
        case 'CHECKING': return 'Conta Corrente';
        case 'SAVINGS': return 'Poupança';
        case 'CREDIT': return 'Cartão de Crédito';
        case 'INVESTMENT': return 'Investimento';
        default: return 'Conta';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

function showSuccess(message) {
    console.log('Success:', message);
    alert('Sucesso: ' + message);
}

function showError(message) {
    console.error('Error:', message);
    alert('Erro: ' + message);
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
}
