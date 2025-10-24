document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-bot-btn');
    const stopBtn = document.getElementById('stop-bot-btn');
    const logDisplay = document.getElementById('log-display');
    const balanceDisplay = document.getElementById('account-balance');
    const botCards = document.querySelectorAll('.bot-card');
    let selectedBot = null;
    let isBotRunning = false;
    let logInterval = null;

    function logMessage(message) { /* ... (same as before) ... */ }
    function updateUI() { /* ... (same as before) ... */ }
    async function fetchBotStatus() { /* ... (same as before) ... */ }

    botCards.forEach(card => {
        card.addEventListener('click', () => {
            if (isBotRunning) return;
            botCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedBot = card.dataset.bot;
            updateUI();
        });
    });

    startBtn.addEventListener('click', async () => { /* ... (same as before) ... */ });
    stopBtn.addEventListener('click', async () => { /* ... (same as before) ... */ });

    // --- INITIALIZATION (This is the corrected logic) ---
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('token');
    
    if (accessToken) {
        localStorage.setItem('deriv_token', accessToken);
        window.history.replaceState({}, document.title, "/dashboard.html");
    }

    if (localStorage.getItem('deriv_token')) {
        logMessage('Commander, your secure token is loaded. Please select a bot to begin.');
        balanceDisplay.textContent = '$10,000.00'; // Placeholder - will be live later
    } else {
        // This should not happen because login is forced, but it's a good failsafe.
        logMessage('CRITICAL ERROR: No secure token found. Please re-login.');
        window.location.href = '/'; // Redirect to login
    }
    updateUI();
});