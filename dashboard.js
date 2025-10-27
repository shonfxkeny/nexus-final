document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-bot-btn');
    const stopBtn = document.getElementById('stop-bot-btn');
    const logDisplay = document.getElementById('log-display');
    const balanceDisplay = document.getElementById('account-balance');
    const botCards = document.querySelectorAll('.bot-card');
    let selectedBot = null;
    let isBotRunning = false;
    let logInterval = null;

    // --- Master Key Retrieval ---
    const MASTER_API_TOKEN = localStorage.getItem('deriv_api_token');

    function logMessage(message) { /* ... (same as before) ... */ }
    function updateUI() { /* ... (same as before) ... */ }
    
    async function fetchBotStatus() {
        if (!MASTER_API_TOKEN || !isBotRunning) {
            clearInterval(logInterval);
            return;
        }
        try {
            const response = await fetch('/.netlify/functions/bot-controller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'status', token: MASTER_API_TOKEN }), // Use the master key
            });
            const data = await response.json();
            if (data.logs) data.logs.forEach(log => logMessage(log));
            if (data.balance) balanceDisplay.textContent = `$${data.balance.toFixed(2)}`;
            if (!data.isRunning) {
                isBotRunning = false;
                clearInterval(logInterval);
                logMessage('Cloud Brain reports bot has halted.');
                updateUI();
            }
        } catch (error) {
            logMessage('Error fetching status from Cloud Brain.');
        }
    }

    botCards.forEach(card => { /* ... (same as before) ... */ });

    startBtn.addEventListener('click', async () => {
        const profitTarget = document.getElementById('profit-target').value;
        const lossLimit = document.getElementById('loss-limit').value;

        if (!selectedBot || !MASTER_API_TOKEN) {
            logMessage('Please select a bot and ensure you are authorized.');
            return;
        }
        logDisplay.innerHTML = '';
        logMessage('Sending activation signal to Cloud Brain...');

        const response = await fetch('/.netlify/functions/bot-controller', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'start',
                token: MASTER_API_TOKEN, // Use the master key
                bot: selectedBot,
                settings: { profitTarget, lossLimit },
            }),
        });
        const data = await response.json();
        if (data.success) {
            isBotRunning = true;
            logMessage(`Cloud Brain Acknowledged. '${selectedBot.toUpperCase()}' is now active.`);
            logInterval = setInterval(fetchBotStatus, 4000);
            updateUI();
        } else {
            logMessage(`Activation failed: ${data.message || 'Unknown error.'}`);
        }
    });

    stopBtn.addEventListener('click', async () => { /* ... (same as before, but ensure it uses MASTER_API_TOKEN) ... */ });

    // --- Initialization ---
    if (!MASTER_API_TOKEN) {
        // If there's no key, you can't be here. Go back to the entrance.
        window.location.href = '/';
        return;
    }
    
    logMessage('Commander, your Master Key is loaded. Please select a bot to begin.');
    balanceDisplay.textContent = '$10,000.00'; // Placeholder
    updateUI();
});
