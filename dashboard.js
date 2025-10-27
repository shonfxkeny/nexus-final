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

    function updateUI() {
        startBtn.style.display = isBotRunning ? 'none' : 'block';
        stopBtn.style.display = isBotRunning ? 'block' : 'none';
        startBtn.disabled = !selectedBot || isBotRunning;
        if (!selectedBot) {
            startBtn.textContent = 'SELECT A BOT';
        } else {
            startBtn.textContent = `ACTIVATE '${selectedBot.toUpperCase()}'`;
        }
    }

    async function fetchBotStatus() {
        if (!MASTER_API_TOKEN || !isBotRunning) {
            clearInterval(logInterval);
            return;
        }
        try {
            const response = await fetch('/.netlify/functions/bot-controller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'status', token: MASTER_API_TOKEN }),
            });
            const data = await response.json();
            if (data.logs) {
                data.logs.forEach(log => {
                    const logType = log.includes('WIN') ? 'success' : log.includes('LOSS') ? 'error' : 'info';
                    logMessage(log, logType);
                });
            }
            if (data.balance) {
                balanceDisplay.textContent = `${data.currency} ${data.balance.toFixed(2)}`;
            }
            if (!data.isRunning) {
                isBotRunning = false;
                clearInterval(logInterval);
                logMessage('Cloud Brain confirms bot has halted.');
                updateUI();
            }
        } catch (error) {
            logMessage('Error fetching status from Cloud Brain.', 'error');
        }
    }

    async function authorizeAndFetchBalance() {
        if (!MASTER_API_TOKEN) {
            window.location.href = '/';
            return;
        }
        logDisplay.innerHTML = '';
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
                localStorage.removeItem('deriv_api_token');
            }
        } catch (error) {
            logMessage('Critical error connecting to Cloud Brain.', 'error');
        }
    }

    botCards.forEach(card => {
        card.addEventListener('click', () => {
            if (isBotRunning) return;
            botCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedBot = card.dataset.bot;
            updateUI();
        });
    });

    startBtn.addEventListener('click', async () => {
        const profitTarget = document.getElementById('profit-target').value;
        const lossLimit = document.getElementById('loss-limit').value;
        if (!selectedBot || !MASTER_API_TOKEN) return;
        
        logDisplay.innerHTML = '';
        logMessage('Sending activation signal to the Prometheus Engine...');
        isBotRunning = true;
        updateUI();

        const response = await fetch('/.netlify/functions/bot-controller', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'start',
                token: MASTER_API_TOKEN,
                bot: selectedBot,
                settings: { profitTarget, lossLimit, stake: 0.35 }, // Stake is now set here
            }),
        });
        const data = await response.json();

        if (data.success) {
            logMessage(`Cloud Brain Acknowledged. '${selectedBot.toUpperCase()}' is now LIVE.`, 'success');
            logInterval = setInterval(fetchBotStatus, 5000); // Poll for updates every 5 seconds
        } else {
            isBotRunning = false;
            logMessage(`Activation failed: ${data.message || 'Unknown error.'}`, 'error');
            updateUI();
        }
    });

    stopBtn.addEventListener('click', async () => {
        const response = await fetch('/.netlify/functions/bot-controller', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'stop', token: MASTER_API_TOKEN }),
        });
        const data = await response.json();
        if (data.success) {
            isBotRunning = false;
            clearInterval(logInterval);
            logMessage('Deactivation signal sent. Bot is halting.');
            updateUI();
        }
    });

    authorizeAndFetchBalance();
    updateUI();
});
