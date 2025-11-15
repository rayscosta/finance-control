// Reset Password Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showMessage('Token de reset não fornecido. Solicite um novo link de reset.', 'error');
        document.getElementById('resetForm').style.display = 'none';
        return;
    }

    // Setup form submission
    const form = document.getElementById('resetForm');
    if (form) {
        form.addEventListener('submit', handleResetPassword);
    }
});

// Handle password reset
async function handleResetPassword(e) {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showMessage('As senhas não coincidem. Por favor, verifique.', 'error');
        return;
    }

    // Validate password length
    if (newPassword.length < 6) {
        showMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }

    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    try {
        // Disable form
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Resetando...';

        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                newPassword: newPassword
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Erro ao resetar senha');
        }

        // Show success message
        showMessage(result.message || 'Senha resetada com sucesso!', 'success');

        // Hide form
        document.getElementById('resetForm').style.display = 'none';

        // Redirect to login after 3 seconds
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 3000);
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        showMessage(error.message, 'error');

        // Re-enable form
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = '🔐 Resetar Senha';
    }
}

// Show message
function showMessage(text, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}
