// Import page functionality

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    if (!await ensureAuth()) return;
    await loadUserInfo();
    await loadAccounts();
    setupFileUpload();
});

// Load user information
async function loadUserInfo() {
    try {
        console.log('🔍 [Import] Carregando informações do usuário...');
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (!token) {
            console.log('❌ [Import] Token não encontrado, redirecionando...');
            window.location.href = '/login.html';
            return;
        }

        console.log('📡 [Import] Fazendo requisição para /api/auth/me');
        const response = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📨 [Import] Resposta recebida:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ [Import] Dados recebidos:', data);
            
            const userNameEl = document.getElementById('userName');
            const userEmailEl = document.getElementById('userEmail');
            
            console.log('🔍 [Import] Elementos:', { userNameEl, userEmailEl });
            
            if (userNameEl) {
                userNameEl.textContent = data.data.name;
                console.log('✅ [Import] Nome atualizado:', data.data.name);
            }
            if (userEmailEl) {
                userEmailEl.textContent = data.data.email;
                console.log('✅ [Import] Email atualizado:', data.data.email);
            }
        } else if (response.status === 401) {
            console.log('❌ [Import] Token inválido, redirecionando...');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('❌ [Import] Erro ao carregar informações:', error);
    }
}

// Load accounts for dropdown
async function loadAccounts() {
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        const response = await fetch('http://localhost:3000/api/accounts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const selectElement = document.getElementById('targetAccount');
            
            if (selectElement && data.data) {
                // Clear existing options except the first one
                selectElement.innerHTML = '<option value="">Selecione a conta</option>';
                
                // Add accounts as options
                data.data.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.id;
                    option.textContent = `${account.name} - ${account.bank || 'Sem banco'}`;
                    selectElement.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar contas:', error);
    }
}

// Setup file upload functionality
function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

// Handle file selection
function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        displaySelectedFiles(files);
        document.getElementById('importBtn').disabled = false;
    }
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('drag-over');
}

// Handle drag leave
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
}

// Handle drop
function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        displaySelectedFiles(files);
        document.getElementById('importBtn').disabled = false;
    }
}

// Display selected files
function displaySelectedFiles(files) {
    const container = document.getElementById('selectedFiles');
    container.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        const fileCard = document.createElement('div');
        fileCard.className = 'file-card';
        fileCard.innerHTML = `
            <div class="file-icon">
                <i class="fas fa-file-${getFileIcon(file.name)}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <button class="btn-icon" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(fileCard);
    });
}

// Get file icon based on extension
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': 'pdf',
        'csv': 'csv',
        'xlsx': 'excel',
        'xls': 'excel',
        'ofx': 'alt'
    };
    return icons[ext] || 'alt';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Select import type
function selectImportType(type) {
    const uploadSection = document.getElementById('uploadSection');
    uploadSection.style.display = 'block';
    uploadSection.scrollIntoView({ behavior: 'smooth' });
    
    // Update title and description based on type
    const titles = {
        'bank': 'Importar Extrato Bancário',
        'credit': 'Importar Fatura de Cartão',
        'manual': 'Importar Planilha Manual',
        'investment': 'Importar Extrato de Investimentos'
    };
    
    const descriptions = {
        'bank': 'Faça upload do extrato bancário em PDF, CSV ou OFX',
        'credit': 'Faça upload da fatura do cartão em PDF ou CSV',
        'manual': 'Faça upload da planilha Excel ou CSV',
        'investment': 'Faça upload do extrato de investimentos'
    };
    
    document.getElementById('uploadTitle').textContent = titles[type] || 'Importar Arquivo';
    document.getElementById('uploadDescription').textContent = descriptions[type] || 'Selecione o arquivo';
}

// Clear files
function clearFiles() {
    document.getElementById('fileInput').value = '';
    document.getElementById('selectedFiles').innerHTML = '';
    document.getElementById('importBtn').disabled = true;
}

// Start import
async function startImport() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('Por favor, selecione um arquivo para importar');
        return;
    }
    
    const targetAccount = document.getElementById('targetAccount').value;
    if (!targetAccount) {
        alert('Por favor, selecione uma conta de destino');
        return;
    }
    
    // Show progress section
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('progressSection').classList.remove('hidden');
    
    // TODO: Implement actual import logic
    // For now, just simulate progress
    simulateImport();
}

// Simulate import progress
function simulateImport() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        updateProgress(progress);
        
        if (progress >= 100) {
            clearInterval(interval);
            showResults();
        }
    }, 500);
}

// Update progress
function updateProgress(percentage) {
    const progressText = document.getElementById('progressPercentage');
    const progressRing = document.querySelector('.progress-ring-fill');
    
    if (progressText) {
        progressText.textContent = `${percentage}%`;
    }
    
    if (progressRing) {
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (percentage / 100) * circumference;
        progressRing.style.strokeDashoffset = offset;
    }
}

// Show results
function showResults() {
    document.getElementById('progressSection').classList.add('hidden');
    document.getElementById('resultsSection').classList.remove('hidden');
    
    // TODO: Update with actual results
    document.getElementById('totalImported').textContent = '45';
    document.getElementById('totalSkipped').textContent = '3';
    document.getElementById('categoriesCreated').textContent = '2';
}

// Import another file
function importAnother() {
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('uploadSection').style.display = 'block';
    clearFiles();
}

// View imported transactions
function viewImported() {
    window.location.href = '/transactions.html';
}

// Go to dashboard
function goToDashboard() {
    window.location.href = '/dashboard.html';
}

// Show templates modal
function showTemplates() {
    document.getElementById('templatesModal').classList.add('active');
}

// Show history modal
function showHistory() {
    document.getElementById('historyModal').classList.add('active');
    // TODO: Load import history
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Download template
function downloadTemplate(templateType) {
    console.log('Downloading template:', templateType);
    // TODO: Implement template download
    alert('Funcionalidade de download de modelos será implementada em breve');
}

// Back to upload
function backToUpload() {
    document.getElementById('previewSection').classList.add('hidden');
    document.getElementById('uploadSection').style.display = 'block';
}

// Remove file
function removeFile(index) {
    const fileInput = document.getElementById('fileInput');
    const files = Array.from(fileInput.files);
    files.splice(index, 1);
    
    // Create a new FileList
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
    
    displaySelectedFiles(fileInput.files);
    
    if (fileInput.files.length === 0) {
        document.getElementById('importBtn').disabled = true;
    }
}
