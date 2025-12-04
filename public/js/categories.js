// Categories page functionality

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    if (!await ensureAuth()) return;
    await loadUserInfo();
    await loadCategories();
});

// Load user information
async function loadUserInfo() {
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('http://localhost:3000/api/auth/me', {
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
        } else if (response.status === 401) {
            // Token inválido ou expirado
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
    }
}

// Load categories
async function loadCategories() {
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        const response = await fetch('http://localhost:3000/api/categories', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayCategories(data.data || []);
        } else {
            console.error('Erro ao carregar categorias');
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Display categories
function displayCategories(categories) {
    // TODO: Implement category display logic
    console.log('Categorias carregadas:', categories);
}
