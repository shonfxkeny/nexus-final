document.addEventListener('DOMContentLoaded', () => {
    const authBtn = document.getElementById('auth-btn');
    const apiTokenInput = document.getElementById('api-token');
    const messageArea = document.getElementById('message-area');

    authBtn.addEventListener('click', () => {
        const token = apiTokenInput.value.trim();

        if (!token) {
            messageArea.textContent = 'Please enter a valid API Token.';
            messageArea.style.color = 'var(--danger-color)';
            return;
        }

        // Save the master key to secure local storage
        localStorage.setItem('deriv_api_token', token);
        
        // Redirect to the dashboard
        window.location.href = '/dashboard.html';
    });
});
