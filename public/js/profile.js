// Profile Page JavaScript

let originalProfileData = {};
let isEditMode = false;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
    await loadUserStats();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', handleProfileUpdate);
    }
}

// Load user profile data
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.location.href = '/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Erro ao carregar perfil');
        }

        const result = await response.json();
        const user = result.data;

        // Store original data
        originalProfileData = {
            name: user.name,
            email: user.email
        };

        // Update UI
        updateProfileUI(user);
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        showMessage('Erro ao carregar perfil', 'error');
    }
}

// Update profile UI
function updateProfileUI(user) {
    // Form fields
    document.getElementById('name').value = user.name;
    document.getElementById('email').value = user.email;

    // Header
    document.getElementById('headerUserName').textContent = user.name;
    document.getElementById('headerUserEmail').textContent = user.email;

    // Avatars (use first letter of name)
    const initial = user.name.charAt(0).toUpperCase();
    document.getElementById('userInitial').textContent = initial;
    document.getElementById('profileInitial').textContent = initial;

    // Joined date
    const joinedDate = new Date(user.createdAt).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('joinedDate').textContent = joinedDate;
}

// Load user statistics
async function loadUserStats() {
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

        // Load accounts
        const accountsResponse = await fetch(`${API_BASE_URL}/accounts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (accountsResponse.ok) {
            const accountsResult = await accountsResponse.json();
            const accounts = accountsResult.data || [];
            document.getElementById('totalAccounts').textContent = accounts.length;
        }

        // Load transactions
        const transactionsResponse = await fetch(`${API_BASE_URL}/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (transactionsResponse.ok) {
            const transactionsResult = await transactionsResponse.json();
            const transactions = transactionsResult.data || [];
            document.getElementById('totalTransactions').textContent = transactions.length;
        }

        // Load user categories
        const categoriesResponse = await fetch(`${API_BASE_URL}/categories/user`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (categoriesResponse.ok) {
            const categoriesResult = await categoriesResponse.json();
            const categories = categoriesResult.data || [];
            document.getElementById('totalCategories').textContent = categories.length;
        }

        // Calculate days active
        const userElement = document.getElementById('joinedDate');
        if (userElement) {
            const joinedText = userElement.textContent;
            // This is a simplification; in a real app, you'd parse the actual date
            document.getElementById('daysActive').textContent = calculateDaysActive();
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Calculate days active
function calculateDaysActive() {
    const joinedDate = originalProfileData.createdAt || new Date();
    const today = new Date();
    const diffTime = Math.abs(today - new Date(joinedDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Toggle edit mode
function toggleEditMode() {
    isEditMode = !isEditMode;
    
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const formActions = document.getElementById('formActions');
    const editBtn = document.getElementById('editBtnText');

    if (isEditMode) {
        // Enable editing
        nameInput.removeAttribute('readonly');
        emailInput.removeAttribute('readonly');
        formActions.style.display = 'flex';
        editBtn.textContent = '❌ Cancelar';
    } else {
        // Disable editing
        cancelEdit();
    }
}

// Cancel edit
function cancelEdit() {
    isEditMode = false;
    
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const formActions = document.getElementById('formActions');
    const editBtn = document.getElementById('editBtnText');

    // Restore original values
    nameInput.value = originalProfileData.name;
    emailInput.value = originalProfileData.email;

    // Disable editing
    nameInput.setAttribute('readonly', true);
    emailInput.setAttribute('readonly', true);
    formActions.style.display = 'none';
    editBtn.textContent = '✏️ Editar';

    // Hide any messages
    hideMessage();
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();

    // Validate
    if (name.length < 2) {
        showMessage('Nome deve ter pelo menos 2 caracteres', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('Email inválido', 'error');
        return;
    }

    // Check if anything changed
    if (name === originalProfileData.name && email === originalProfileData.email) {
        showMessage('Nenhuma alteração foi feita', 'info');
        return;
    }

    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        const updateData = {};
        if (name !== originalProfileData.name) updateData.name = name;
        if (email !== originalProfileData.email) updateData.email = email;

        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Erro ao atualizar perfil');
        }

        // Update original data
        originalProfileData = {
            name: result.data.name,
            email: result.data.email
        };

        // Update UI
        updateProfileUI(result.data);

        // Exit edit mode
        toggleEditMode();

        // Show success message
        showMessage('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        showMessage(error.message, 'error');
    }
}

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show password reset modal
function showPasswordResetModal() {
    const modal = document.getElementById('passwordResetModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('resetMessage').style.display = 'none';
    }
}

// Close password reset modal
function closePasswordResetModal() {
    const modal = document.getElementById('passwordResetModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('resetMessage').style.display = 'none';
    }
}

// Request password reset
async function requestPasswordReset() {
    try {
        const email = originalProfileData.email;

        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Erro ao solicitar reset de senha');
        }

        // Show success message
        const resetMessage = document.getElementById('resetMessage');
        if (resetMessage) {
            resetMessage.textContent = result.message;
            resetMessage.className = 'message success';
            resetMessage.style.display = 'block';
        }

        // Close modal after 3 seconds
        setTimeout(() => {
            closePasswordResetModal();
        }, 3000);
    } catch (error) {
        console.error('Erro ao solicitar reset de senha:', error);
        const resetMessage = document.getElementById('resetMessage');
        if (resetMessage) {
            resetMessage.textContent = error.message;
            resetMessage.className = 'message error';
            resetMessage.style.display = 'block';
        }
    }
}

// Show message
function showMessage(text, type = 'info') {
    const messageDiv = document.getElementById('profileMessage');
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideMessage();
        }, 5000);
    }
}

// Hide message
function hideMessage() {
    const messageDiv = document.getElementById('profileMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('passwordResetModal');
    if (e.target === modal) {
        closePasswordResetModal();
    }
});

// Logout function (defined in auth.js, but adding here for completeness)
function logout() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    window.location.href = '/login.html';
}
