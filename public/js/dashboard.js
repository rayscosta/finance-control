// Dashboard functionality
let charts = {};
let currentPeriod = 'month';

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadUserInfo();
    await loadDashboardData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Period filter change
    const periodFilter = document.getElementById('periodFilter');
    if (periodFilter) {
        periodFilter.addEventListener('change', handlePeriodChange);
    }
    
    // Chart controls
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', handleChartControl);
    });
    
    // Quick transaction form
    const quickForm = document.getElementById('quickTransactionForm');
    if (quickForm) {
        quickForm.addEventListener('submit', handleQuickTransaction);
    }
}

// Load user information
async function loadUserInfo() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const userNameEl = document.getElementById('userName');
            const userEmailEl = document.getElementById('userEmail');
            
            if (userNameEl) userNameEl.textContent = data.data.name;
            if (userEmailEl) userEmailEl.textContent = data.data.email;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadSummaryData(),
            loadAccountsData(),
            loadRecentTransactions(),
            loadChartsData(),
            loadHealthScore()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load summary cards data
async function loadSummaryData() {
    try {
        const token = localStorage.getItem('authToken');
        const dates = getPeriodDates(currentPeriod);
        
        const response = await fetch(`/api/transactions/stats?startDate=${dates.start}&endDate=${dates.end}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const stats = data.data;
            
            // Update summary cards
            updateElementText('totalIncome', formatCurrency(stats.totalIncome || 0));
            updateElementText('totalExpense', formatCurrency(stats.totalExpense || 0));
            
            const netBalance = (stats.totalIncome || 0) - (stats.totalExpense || 0);
            updateElementText('netBalance', formatCurrency(netBalance));
            
            // Calculate savings rate
            const savingsRate = stats.totalIncome > 0 ? ((netBalance / stats.totalIncome) * 100) : 0;
            updateElementText('savingsRate', savingsRate.toFixed(1) + '%');
            
            // Load comparison data for changes
            await loadComparisonData(stats);
        }
    } catch (error) {
        console.error('Error loading summary data:', error);
    }
}

// Load comparison data for percentage changes
async function loadComparisonData(currentStats) {
    try {
        const token = localStorage.getItem('authToken');
        const previousDates = getPreviousPeriodDates(currentPeriod);
        
        const response = await fetch(`/api/transactions/stats?startDate=${previousDates.start}&endDate=${previousDates.end}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const previousStats = data.data;
            
            // Calculate changes
            const incomeChange = calculatePercentageChange(previousStats.totalIncome, currentStats.totalIncome);
            const expenseChange = calculatePercentageChange(previousStats.totalExpense, currentStats.totalExpense);
            
            // Update change indicators
            updateChangeIndicator('incomeChange', incomeChange, true);
            updateChangeIndicator('expenseChange', expenseChange, false);
        }
    } catch (error) {
        console.error('Error loading comparison data:', error);
    }
}

// Update change indicator
function updateChangeIndicator(elementId, change, isPositiveGood) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const isPositive = change >= 0;
    const isGood = isPositiveGood ? isPositive : !isPositive;
    
    element.textContent = `${isPositive ? '+' : ''}${change.toFixed(1)}% vs período anterior`;
    element.className = `card-change ${isGood ? 'positive' : 'negative'}`;
}

// Load accounts data
async function loadAccountsData() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/accounts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const accounts = data.data || [];
            
            renderAccountsList(accounts);
            populateAccountSelects(accounts);
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
}

// Render accounts list
function renderAccountsList(accounts) {
    const container = document.getElementById('accountsList');
    if (!container) return;
    
    if (accounts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-credit-card"></i>
                <h3>Nenhuma conta encontrada</h3>
                <p>Adicione uma conta para começar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = accounts.map(account => `
        <div class="account-item">
            <div class="account-info">
                <div class="account-icon">
                    <i class="fas ${getAccountIcon(account.type)}"></i>
                </div>
                <div class="account-details">
                    <h4>${account.name}</h4>
                    <p>${getAccountTypeLabel(account.type)}</p>
                </div>
            </div>
            <div class="account-balance">${formatCurrency(account.balance)}</div>
        </div>
    `).join('');
}

// Populate account selects
function populateAccountSelects(accounts) {
    const selects = ['quickAccount'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Clear existing options except first
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.name} (${formatCurrency(account.balance)})`;
            select.appendChild(option);
        });
    });
}

// Load recent transactions
async function loadRecentTransactions() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/transactions?limit=5&page=1', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const transactions = data.data.transactions || [];
            
            renderRecentTransactions(transactions);
        }
    } catch (error) {
        console.error('Error loading recent transactions:', error);
    }
}

// Render recent transactions
function renderRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>Nenhuma transação recente</h3>
                <p>Suas transações aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = transactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-icon ${transaction.type.toLowerCase()}">
                    <i class="fas ${getTransactionIcon(transaction.type)}"></i>
                </div>
                <div class="transaction-details">
                    <h4>${transaction.description}</h4>
                    <p>${formatDate(transaction.date)} • ${transaction.category?.name || 'Sem categoria'}</p>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type.toLowerCase()}">
                ${transaction.type === 'EXPENSE' ? '-' : ''}${formatCurrency(Math.abs(transaction.amount))}
            </div>
        </div>
    `).join('');
}

// Load charts data
async function loadChartsData() {
    await Promise.all([
        loadTrendChart(),
        loadCategoryChart(),
        loadWeeklyChart()
    ]);
}

// Load trend chart
async function loadTrendChart() {
    try {
        const token = localStorage.getItem('authToken');
        const months = 6; // Default to 6 months
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        
        const response = await fetch(`/api/transactions/trend?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderTrendChart(data.data);
        }
    } catch (error) {
        console.error('Error loading trend chart:', error);
        // Create chart with sample data
        renderTrendChart([]);
    }
}

// Render trend chart
function renderTrendChart(data) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    // Prepare sample data if empty
    const chartData = data.length > 0 ? data : generateSampleTrendData();
    
    if (charts.trend) {
        charts.trend.destroy();
    }
    
    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(item => formatMonth(item.month)),
            datasets: [
                {
                    label: 'Receitas',
                    data: chartData.map(item => item.income || 0),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Despesas',
                    data: chartData.map(item => item.expense || 0),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Load category chart
async function loadCategoryChart() {
    try {
        const token = localStorage.getItem('authToken');
        const dates = getPeriodDates(currentPeriod);
        
        const response = await fetch(`/api/transactions/categories?startDate=${dates.start}&endDate=${dates.end}&type=EXPENSE`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderCategoryChart(data.data);
        }
    } catch (error) {
        console.error('Error loading category chart:', error);
        renderCategoryChart([]);
    }
}

// Render category chart
function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    // Prepare sample data if empty
    const chartData = data.length > 0 ? data : generateSampleCategoryData();
    
    if (charts.category) {
        charts.category.destroy();
    }
    
    const colors = [
        '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#6366f1'
    ];
    
    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.map(item => item.category),
            datasets: [{
                data: chartData.map(item => item.amount),
                backgroundColor: colors.slice(0, chartData.length),
                borderWidth: 0,
                hoverBorderWidth: 4,
                hoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Load weekly chart
async function loadWeeklyChart() {
    try {
        const token = localStorage.getItem('authToken');
        const dates = getPeriodDates(currentPeriod);
        
        const response = await fetch(`/api/transactions/weekly?startDate=${dates.start}&endDate=${dates.end}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderWeeklyChart(data.data);
        }
    } catch (error) {
        console.error('Error loading weekly chart:', error);
        renderWeeklyChart([]);
    }
}

// Render weekly chart
function renderWeeklyChart(data) {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    
    // Prepare sample data if empty
    const chartData = data.length > 0 ? data : generateSampleWeeklyData();
    
    if (charts.weekly) {
        charts.weekly.destroy();
    }
    
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    charts.weekly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekDays,
            datasets: [{
                label: 'Gastos',
                data: chartData,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: '#3b82f6',
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Load health score
async function loadHealthScore() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/analytics/health-score', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderHealthScore(data.data);
        }
    } catch (error) {
        console.error('Error loading health score:', error);
        // Render with sample data
        renderHealthScore({
            overall: 75,
            savings: 60,
            diversification: 80,
            consistency: 85,
            tips: [
                'Tente economizar pelo menos 20% da sua renda',
                'Diversifique seus gastos entre diferentes categorias',
                'Mantenha uma renda consistente todos os meses'
            ]
        });
    }
}

// Render health score
function renderHealthScore(data) {
    updateElementText('healthScore', data.overall || 0);
    
    // Update indicator bars
    updateIndicatorBar('savingsBar', 'savingsIndicator', data.savings || 0);
    updateIndicatorBar('diversificationBar', 'diversificationIndicator', data.diversification || 0);
    updateIndicatorBar('consistencyBar', 'consistencyIndicator', data.consistency || 0);
    
    // Render tips
    const tipsContainer = document.getElementById('healthTips');
    if (tipsContainer && data.tips && data.tips.length > 0) {
        tipsContainer.innerHTML = data.tips.map(tip => `
            <div class="health-tip">
                <i class="fas fa-lightbulb"></i>
                <span>${tip}</span>
            </div>
        `).join('');
    }
}

// Update indicator bar
function updateIndicatorBar(barId, valueId, percentage) {
    const bar = document.getElementById(barId);
    const value = document.getElementById(valueId);
    
    if (bar) {
        setTimeout(() => {
            bar.style.width = `${percentage}%`;
        }, 500);
    }
    
    if (value) {
        value.textContent = `${percentage}%`;
    }
}

// Handle period change
async function handlePeriodChange(e) {
    currentPeriod = e.target.value;
    await loadDashboardData();
}

// Handle chart controls
function handleChartControl(e) {
    const button = e.target;
    const chartType = button.dataset.chart;
    const value = button.dataset.period || button.dataset.type;
    
    // Update active state
    button.parentElement.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // Reload chart with new parameters
    if (chartType === 'trend') {
        loadTrendChart(value);
    } else if (chartType === 'category') {
        loadCategoryChart(value);
    }
}

// Quick transaction functions
function quickTransaction(type) {
    const typeField = document.getElementById('quickTransactionType');
    const modal = document.getElementById('quickTransactionModal');
    const title = document.getElementById('quickModalTitle');
    
    if (typeField) typeField.value = type;
    
    const typeInfo = {
        INCOME: { icon: 'fa-plus', title: 'Adicionar Receita', color: '#10b981' },
        EXPENSE: { icon: 'fa-minus', title: 'Adicionar Despesa', color: '#ef4444' },
        TRANSFER: { icon: 'fa-exchange-alt', title: 'Nova Transferência', color: '#3b82f6' }
    };
    
    const info = typeInfo[type];
    if (title) {
        title.innerHTML = `<i class="fas ${info.icon}"></i> ${info.title}`;
    }
    
    // Load categories for the type
    loadQuickCategories(type);
    
    showModal('quickTransactionModal');
}

// Load categories for quick transaction
async function loadQuickCategories(type) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/categories', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const categories = data.data.filter(cat => 
                type === 'TRANSFER' || cat.type === type
            );
            
            const select = document.getElementById('quickCategory');
            if (select) {
                select.innerHTML = '<option value="">Selecione a categoria</option>';
                
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = `${category.icon} ${category.name}`;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Handle quick transaction submission
async function handleQuickTransaction(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        type: formData.get('type'),
        amount: parseFloat(formData.get('amount')),
        description: formData.get('description'),
        categoryId: formData.get('categoryId') || null,
        accountId: formData.get('accountId'),
        date: new Date().toISOString().split('T')[0]
    };
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal('quickTransactionModal');
            await loadDashboardData();
            showSuccess('Transação adicionada com sucesso!');
            
            // Reset form
            document.getElementById('quickTransactionForm').reset();
        } else {
            const error = await response.json();
            showError(error.message || 'Erro ao criar transação');
        }
    } catch (error) {
        console.error('Error creating transaction:', error);
        showError('Erro ao criar transação');
    }
}

// Utility functions
function getPeriodDates(period) {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
        case 'month':
            start.setDate(1);
            break;
        case 'quarter':
            start.setMonth(start.getMonth() - 3);
            break;
        case 'year':
            start.setMonth(0);
            start.setDate(1);
            break;
    }
    
    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
}

function getPreviousPeriodDates(period) {
    const current = getPeriodDates(period);
    const start = new Date(current.start);
    const end = new Date(current.end);
    
    switch (period) {
        case 'month':
            start.setMonth(start.getMonth() - 1);
            end.setMonth(end.getMonth() - 1);
            break;
        case 'quarter':
            start.setMonth(start.getMonth() - 3);
            end.setMonth(end.getMonth() - 3);
            break;
        case 'year':
            start.setFullYear(start.getFullYear() - 1);
            end.setFullYear(end.getFullYear() - 1);
            break;
    }
    
    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
}

function calculatePercentageChange(oldValue, newValue) {
    if (!oldValue || oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

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

function getTransactionIcon(type) {
    switch (type) {
        case 'INCOME': return 'fa-arrow-up';
        case 'EXPENSE': return 'fa-arrow-down';
        case 'TRANSFER': return 'fa-exchange-alt';
        default: return 'fa-file';
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

function formatMonth(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit'
    });
}

function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

// Sample data generators
function generateSampleTrendData() {
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        data.push({
            month: date.toISOString(),
            income: Math.random() * 5000 + 3000,
            expense: Math.random() * 3000 + 2000
        });
    }
    
    return data;
}

function generateSampleCategoryData() {
    return [
        { category: 'Alimentação', amount: 800 },
        { category: 'Transporte', amount: 400 },
        { category: 'Saúde', amount: 300 },
        { category: 'Lazer', amount: 250 },
        { category: 'Outros', amount: 200 }
    ];
}

function generateSampleWeeklyData() {
    return Array.from({ length: 7 }, () => Math.random() * 200 + 50);
}

// Modal and message functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function showSuccess(message) {
    // You can implement a toast notification system here
    console.log('Success:', message);
    alert('Sucesso: ' + message);
}

function showError(message) {
    // You can implement a toast notification system here
    console.error('Error:', message);
    alert('Erro: ' + message);
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
}
