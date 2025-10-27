document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const startBtn = document.getElementById('start-bot-btn');
    const stopBtn = document.getElementById('stop-bot-btn');
    const logDisplay = document.getElementById('log-display');
    const balanceDisplay = document.getElementById('account-balance');
    const accountTypeSelect = document.getElementById('account-type');
    const botCards = document.querySelectorAll('.bot-card');
    let selectedBot = null;
    let isBotRunning = false;
    let logInterval = null;

    // --- Master Key Retrieval ---
    const MASTER_API_TOKEN = localStorage.getItem('deriv_api_token');

    function logMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = 'log-message';
        if (type === 'error') messageEl.style.color = 'var(--danger-color)';
        if (type === 'success') messageEl.style.color = 'var(--success-color)';
        messageEl.textContent = `> ${message}`;
        logDisplay.appendChild(messageEl);
        logDisplay.scrollTop = logDisplay.scrollHeight;
    }

    function updateUI() { /* ... (same as before) ... */ }
    async function fetchBotStatus() { /* ... (same as before, using MASTER_API_TOKEN) ... */ }

    // --- CRITICAL LIVE-WIRE FUNCTION ---
    async function authorizeAndFetchBalance() {
        if (!MASTER_API_TOKEN) {
            window.location.href = '/'; // Not authorized, go back to login
            return;
        }

        logMessage('Authorizing with Master Key...');

        try {
            const response = await fetch('/.netlify/functions/bot-controller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'authorize', token: MASTER_API_TOKEN }),
            });

            const data = await response.json();

            if (data.success) {
                balanceDisplay.textContent = `${data.currency} ${data.balance.toFixed(2)}`;
                accountTypeSelect.value = data.is_virtual ? 'demo' : 'real';
                logMessage(`Authorization successful. Welcome, Commander.`, 'success');
                logMessage(`Account: ${data.account_type} | Balance: ${data.currency} ${data.balance.toFixed(2)}`);
            } else {
                logMessage(`Authorization Failed: ${data.message}`, 'error');
                localStorage.removeItem('deriv_api_token'); // Remove bad token
            }
        } catch (error) {
            logMessage('Critical error connecting to Cloud Brain.', 'error');
        }
    }

    botCards.forEach(card => { /* ... (same as before) ... */ });
    startBtn.addEventListener('click', async () => { /* ... (same as before, using MASTER_API_TOKEN) ... */ });
    stopBtn.addEventListener('click', async () => { /* ... (same as before, using MASTER_API_TOKEN) ... */ });

    // --- INITIALIZATION ---
    authorizeAndFetchBalance(); // This is the new, live-wired startup sequence.
    updateUI();
});
