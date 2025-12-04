// Transactions page functionality
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
let transactionToDelete = null;
let currentView = 'table';

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    if (!await ensureAuth()) return;
    await loadUserInfo();
    await loadCategories();
    await loadAccounts();
    await loadTransactions();
    await loadStats();
    setupEventListeners();
    setDefaultDate();
});

// Setup event listeners
function setupEventListeners() {
    // Form submissions
    document.getElementById('newTransactionForm').addEventListener('submit', handleNewTransaction);
    document.getElementById('editTransactionForm').addEventListener('submit', handleEditTransaction);
    
    // Recurring checkbox
    document.getElementById('isRecurring').addEventListener('change', toggleRecurringOptions);
    
    // View controls
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            switchView(view);
        });
    });
    
    // Transaction type change in new transaction form
    document.getElementById('transactionType').addEventListener('change', updateCategoriesForType);
    document.getElementById('editTransactionType').addEventListener('change', updateCategoriesForEdit);
}

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
    
    // Set default filter dates (current month)
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    document.getElementById('startDate').value = firstDay;
    document.getElementById('endDate').value = lastDay;
}

// Load user information
async function loadUserInfo() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('userName').textContent = data.data.name;
            document.getElementById('userEmail').textContent = data.data.email;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load categories for dropdowns
async function loadCategories() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3000/api/categories', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const categories = data.data;
            
            // Populate category dropdowns
            populateCategorySelect('transactionCategory', categories);
            populateCategorySelect('editTransactionCategory', categories);
            populateCategorySelect('categoryFilter', categories, true);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Populate category select
function populateCategorySelect(selectId, categories, includeEmpty = false) {
    const select = document.getElementById(selectId);
    
    // Clear existing options (except first one for forms)
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    // Group categories by type
    const incomeCategories = categories.filter(cat => cat.type === 'INCOME');
    const expenseCategories = categories.filter(cat => cat.type === 'EXPENSE');
    
    // Add income categories
    if (incomeCategories.length > 0) {
        const incomeGroup = document.createElement('optgroup');
        incomeGroup.label = '💰 Receitas';
        incomeCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.icon} ${category.name}`;
            option.dataset.type = 'INCOME';
            incomeGroup.appendChild(option);
        });
        select.appendChild(incomeGroup);
    }
    
    // Add expense categories
    if (expenseCategories.length > 0) {
        const expenseGroup = document.createElement('optgroup');
        expenseGroup.label = '💸 Despesas';
        expenseCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.icon} ${category.name}`;
            option.dataset.type = 'EXPENSE';
            expenseGroup.appendChild(option);
        });
        select.appendChild(expenseGroup);
    }
}

// Update categories based on transaction type
function updateCategoriesForType() {
    const type = document.getElementById('transactionType').value;
    const categorySelect = document.getElementById('transactionCategory');
    
    // Show/hide options based on type
    Array.from(categorySelect.options).forEach(option => {
        if (option.value === '') return; // Skip empty option
        
        const optionType = option.dataset.type;
        if (type === '' || type === 'TRANSFER' || optionType === type) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    });
    
    // Reset selection if hidden
    if (categorySelect.selectedOptions[0]?.style.display === 'none') {
        categorySelect.value = '';
    }
}

// Update categories for edit form
function updateCategoriesForEdit() {
    const type = document.getElementById('editTransactionType').value;
    const categorySelect = document.getElementById('editTransactionCategory');
    
    // Show/hide options based on type
    Array.from(categorySelect.options).forEach(option => {
        if (option.value === '') return; // Skip empty option
        
        const optionType = option.dataset.type;
        if (type === '' || type === 'TRANSFER' || optionType === type) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    });
    
    // Reset selection if hidden
    if (categorySelect.selectedOptions[0]?.style.display === 'none') {
        categorySelect.value = '';
    }
}

// Load accounts for dropdowns
async function loadAccounts() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3000/api/accounts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const accounts = data.data || [];
            
            // Populate account dropdowns
            populateAccountSelect('transactionAccount', accounts);
            populateAccountSelect('editTransactionAccount', accounts);
            populateAccountSelect('accountFilter', accounts, true);
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
        // Create default account if none exist
        await createDefaultAccount();
    }
}

// Create default account if none exist
async function createDefaultAccount() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3000/api/accounts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Conta Principal',
                type: 'CHECKING',
                balance: 0
            })
        });
        
        if (response.ok) {
            await loadAccounts(); // Reload accounts
        }
    } catch (error) {
        console.error('Error creating default account:', error);
    }
}

// Populate account select
function populateAccountSelect(selectId, accounts, includeEmpty = false) {
    const select = document.getElementById(selectId);
    
    // Clear existing options (except first one for forms)
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = `${account.name} (${formatCurrency(account.balance)})`;
        select.appendChild(option);
    });
}

// Load monthly stats
async function loadStats() {
    try {
        const token = localStorage.getItem('authToken');
        const currentMonth = new Date();
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();
        
        const response = await fetch(`/api/transactions/stats?startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const stats = data.data;
            
            document.getElementById('monthlyIncome').textContent = formatCurrency(stats.totalIncome || 0);
            document.getElementById('monthlyExpense').textContent = formatCurrency(stats.totalExpense || 0);
            document.getElementById('monthlyBalance').textContent = formatCurrency((stats.totalIncome || 0) - (stats.totalExpense || 0));
            document.getElementById('totalTransactions').textContent = stats.totalTransactions || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load transactions
async function loadTransactions() {
    showLoading();
    
    try {
        const token = localStorage.getItem('authToken');
        const params = new URLSearchParams({
            page: currentPage,
            limit: 20,
            ...currentFilters
        });
        
        const response = await fetch(`/api/transactions?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const { transactions, pagination } = data.data;
            
            currentPage = pagination.currentPage;
            totalPages = pagination.totalPages;
            
            if (currentView === 'table') {
                renderTransactionsTable(transactions);
            } else {
                renderTransactionCards(transactions);
            }
            
            updatePagination();
        } else {
            showError('Erro ao carregar transações');
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        showError('Erro ao carregar transações');
    } finally {
        hideLoading();
    }
}

// Render transactions table
function renderTransactionsTable(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div>
                        <i class="fas fa-inbox"></i>
                        <h3>Nenhuma transação encontrada</h3>
                        <p>Adicione sua primeira transação clicando no botão "Nova Transação"</p>
                        <button class="btn btn-primary" onclick="showNewTransactionModal()">
                            <i class="fas fa-plus"></i>
                            Nova Transação
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>
                <div>
                    <strong>${transaction.description}</strong>
                    ${transaction.referenceNumber ? `<br><small class="text-muted">Ref: ${transaction.referenceNumber}</small>` : ''}
                </div>
            </td>
            <td>
                <div class="transaction-category">
                    <span class="category-icon">${transaction.category?.icon || '📄'}</span>
                    <span>${transaction.category?.name || 'Sem categoria'}</span>
                </div>
            </td>
            <td>${transaction.account?.name || 'Conta removida'}</td>
            <td>
                <span class="transaction-type ${transaction.type.toLowerCase()}">
                    ${getTypeIcon(transaction.type)} ${getTypeLabel(transaction.type)}
                </span>
            </td>
            <td>
                <span class="transaction-amount ${transaction.type.toLowerCase()}">
                    ${transaction.type === 'EXPENSE' ? '-' : ''}${formatCurrency(Math.abs(transaction.amount))}
                </span>
            </td>
            <td class="transaction-actions">
                <button class="action-btn edit" onclick="editTransaction('${transaction.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteTransaction('${transaction.id}')" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Render transaction cards
function renderTransactionCards(transactions) {
    const container = document.getElementById('transactionCards');
    container.innerHTML = '';
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Nenhuma transação encontrada</h3>
                <p>Adicione sua primeira transação clicando no botão "Nova Transação"</p>
                <button class="btn btn-primary" onclick="showNewTransactionModal()">
                    <i class="fas fa-plus"></i>
                    Nova Transação
                </button>
            </div>
        `;
        return;
    }
    
    transactions.forEach(transaction => {
        const card = document.createElement('div');
        card.className = 'transaction-card';
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${transaction.description}</div>
                    <div class="card-date">${formatDate(transaction.date)}</div>
                </div>
                <div class="card-amount ${transaction.type.toLowerCase()}">
                    ${transaction.type === 'EXPENSE' ? '-' : ''}${formatCurrency(Math.abs(transaction.amount))}
                </div>
            </div>
            <div class="card-body">
                <div class="card-field">
                    <div class="card-field-label">Categoria</div>
                    <div class="card-field-value">
                        ${transaction.category?.icon || '📄'} ${transaction.category?.name || 'Sem categoria'}
                    </div>
                </div>
                <div class="card-field">
                    <div class="card-field-label">Conta</div>
                    <div class="card-field-value">${transaction.account?.name || 'Conta removida'}</div>
                </div>
                <div class="card-field">
                    <div class="card-field-label">Tipo</div>
                    <div class="card-field-value">
                        <span class="transaction-type ${transaction.type.toLowerCase()}">
                            ${getTypeIcon(transaction.type)} ${getTypeLabel(transaction.type)}
                        </span>
                    </div>
                </div>
                ${transaction.referenceNumber ? `
                    <div class="card-field">
                        <div class="card-field-label">Referência</div>
                        <div class="card-field-value">${transaction.referenceNumber}</div>
                    </div>
                ` : ''}
            </div>
            <div class="card-footer">
                <button class="action-btn edit" onclick="editTransaction('${transaction.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="action-btn delete" onclick="deleteTransaction('${transaction.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Switch between table and cards view
function switchView(view) {
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Show/hide views
    document.getElementById('tableView').classList.toggle('hidden', view !== 'table');
    document.getElementById('cardsView').classList.toggle('hidden', view !== 'cards');
    
    // Re-render with current view
    loadTransactions();
}

// Show/hide filters panel
function showFilters() {
    const panel = document.getElementById('filtersPanel');
    panel.classList.toggle('show');
}

// Apply filters
function applyFilters() {
    const filters = {};
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const type = document.getElementById('typeFilter').value;
    const categoryId = document.getElementById('categoryFilter').value;
    const accountId = document.getElementById('accountFilter').value;
    const minAmount = document.getElementById('minAmount').value;
    const maxAmount = document.getElementById('maxAmount').value;
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (type) filters.type = type;
    if (categoryId) filters.categoryId = categoryId;
    if (accountId) filters.accountId = accountId;
    if (minAmount) filters.minAmount = minAmount;
    if (maxAmount) filters.maxAmount = maxAmount;
    
    currentFilters = filters;
    currentPage = 1;
    loadTransactions();
    
    // Hide filters panel
    document.getElementById('filtersPanel').classList.remove('show');
}

// Clear filters
function clearFilters() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('accountFilter').value = '';
    document.getElementById('minAmount').value = '';
    document.getElementById('maxAmount').value = '';
    
    currentFilters = {};
    currentPage = 1;
    loadTransactions();
}

// Show new transaction modal
function showNewTransactionModal() {
    document.getElementById('newTransactionForm').reset();
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('recurringOptions').classList.add('hidden');
    showModal('newTransactionModal');
}

// Handle new transaction form submission
async function handleNewTransaction(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        type: formData.get('type'),
        amount: parseFloat(formData.get('amount')),
        description: formData.get('description'),
        categoryId: formData.get('categoryId') || null,
        accountId: formData.get('accountId'),
        date: formData.get('date'),
        referenceNumber: formData.get('referenceNumber') || null,
        isRecurring: formData.get('isRecurring') === 'on',
        recurringType: formData.get('recurringType') || null
    };
    
    try {
        showLoading();
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3000/api/transactions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal('newTransactionModal');
            await loadTransactions();
            await loadStats();
            showSuccess('Transação criada com sucesso!');
        } else {
            const error = await response.json();
            showError(error.message || 'Erro ao criar transação');
        }
    } catch (error) {
        console.error('Error creating transaction:', error);
        showError('Erro ao criar transação');
    } finally {
        hideLoading();
    }
}

// Edit transaction
async function editTransaction(id) {
    try {
        showLoading();
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/transactions/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const transaction = data.data;
            
            // Populate edit form
            document.getElementById('editTransactionId').value = transaction.id;
            document.getElementById('editTransactionType').value = transaction.type;
            document.getElementById('editTransactionAmount').value = Math.abs(transaction.amount);
            document.getElementById('editTransactionDescription').value = transaction.description;
            document.getElementById('editTransactionCategory').value = transaction.categoryId || '';
            document.getElementById('editTransactionAccount').value = transaction.accountId;
            document.getElementById('editTransactionDate').value = transaction.date.split('T')[0];
            document.getElementById('editTransactionReference').value = transaction.referenceNumber || '';
            
            // Update categories for the selected type
            updateCategoriesForEdit();
            
            showModal('editTransactionModal');
        } else {
            showError('Erro ao carregar transação');
        }
    } catch (error) {
        console.error('Error loading transaction:', error);
        showError('Erro ao carregar transação');
    } finally {
        hideLoading();
    }
}

// Handle edit transaction form submission
async function handleEditTransaction(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const id = formData.get('id');
    const data = {
        type: formData.get('type'),
        amount: parseFloat(formData.get('amount')),
        description: formData.get('description'),
        categoryId: formData.get('categoryId') || null,
        accountId: formData.get('accountId'),
        date: formData.get('date'),
        referenceNumber: formData.get('referenceNumber') || null
    };
    
    try {
        showLoading();
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/transactions/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal('editTransactionModal');
            await loadTransactions();
            await loadStats();
            showSuccess('Transação atualizada com sucesso!');
        } else {
            const error = await response.json();
            showError(error.message || 'Erro ao atualizar transação');
        }
    } catch (error) {
        console.error('Error updating transaction:', error);
        showError('Erro ao atualizar transação');
    } finally {
        hideLoading();
    }
}

// Delete transaction
function deleteTransaction(id) {
    transactionToDelete = id;
    showModal('deleteTransactionModal');
}

// Confirm delete transaction
async function confirmDeleteTransaction() {
    if (!transactionToDelete) return;
    
    try {
        showLoading();
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/transactions/${transactionToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            closeModal('deleteTransactionModal');
            await loadTransactions();
            await loadStats();
            showSuccess('Transação excluída com sucesso!');
            transactionToDelete = null;
        } else {
            const error = await response.json();
            showError(error.message || 'Erro ao excluir transação');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showError('Erro ao excluir transação');
    } finally {
        hideLoading();
    }
}

// Toggle recurring options
function toggleRecurringOptions() {
    const isRecurring = document.getElementById('isRecurring').checked;
    const recurringOptions = document.getElementById('recurringOptions');
    
    if (isRecurring) {
        recurringOptions.classList.remove('hidden');
    } else {
        recurringOptions.classList.add('hidden');
        document.getElementById('recurringType').value = '';
    }
}

// Pagination
function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        loadTransactions();
    }
}

function updatePagination() {
    document.getElementById('pageInfo').textContent = `Página ${currentPage} de ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

// Utility functions
function getTypeIcon(type) {
    switch (type) {
        case 'INCOME': return '⬆️';
        case 'EXPENSE': return '⬇️';
        case 'TRANSFER': return '🔄';
        default: return '📄';
    }
}

function getTypeLabel(type) {
    switch (type) {
        case 'INCOME': return 'Receita';
        case 'EXPENSE': return 'Despesa';
        case 'TRANSFER': return 'Transferência';
        default: return 'Desconhecido';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
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

// Loading and message functions
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

function showSuccess(message) {
    // You can implement a toast notification system here
    alert(message); // Temporary solution
}

function showError(message) {
    // You can implement a toast notification system here
    alert(message); // Temporary solution
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
}
