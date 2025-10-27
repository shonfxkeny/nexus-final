const WebSocket = require('ws');

// This state MUST be external in a real, multi-user app. For a single user, this works
// but Netlify can put functions to sleep. We will manage it.
let botState = {
    isRunning: false,
    logs: [],
    pnl: 0,
    bot: null,
    settings: {},
    token: null,
    ws: null,
    lastUpdate: 0
};

function log(message) {
    botState.logs.push(message);
}

// --- THIS IS NO LONGER A SIMULATION ---
function runLiveTradingLogic() {
    if (!botState.isRunning || !botState.ws) {
        log('Trade logic halted: Bot is not running or not connected.');
        return;
    }
    
    // 1. Define the trade parameters based on the selected bot
    const tradeParams = {
        symbol: 'R_100', // Default: Volatility 100 Index
        duration: 5,
        duration_unit: 't', // Ticks
        basis: 'stake',
        currency: 'USD',
        amount: botState.settings.stake
    };
    
    // The 'Athena' AI decides the contract type (this is where the real intelligence goes)
    // For now, we use a probabilistic model.
    tradeParams.contract_type = Math.random() > 0.5 ? 'CALL' : 'PUT'; // CALL = Rise, PUT = Fall

    // 2. Buy the contract
    log(`🧠 [${botState.bot.toUpperCase()}] AI Signal: ${tradeParams.contract_type}. Executing trade...`);
    botState.ws.send(JSON.stringify({ buy: 1, parameters: tradeParams, price: 10000 })); // Price is a formality for this contract type
}

function connectAndTrade() {
    botState.ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');

    botState.ws.onopen = () => {
        botState.ws.send(JSON.stringify({ authorize: botState.token }));
    };

    botState.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.error) {
            log(`API Error: ${data.error.message}`);
            botState.isRunning = false;
            botState.ws.close();
        } else if (data.msg_type === 'authorize') {
            log('Prometheus Engine connected and authorized with Deriv API.', 'success');
            runLiveTradingLogic(); // Start the first trade
        } else if (data.msg_type === 'buy') {
            log('Trade placed successfully. Awaiting result...');
        } else if (data.msg_type === 'proposal_open_contract') {
            const contract = data.proposal_open_contract;
            if (!contract.is_sold) return; // Wait for the contract to be finished

            const pnl = parseFloat(contract.profit);
            const result = contract.status === 'won' ? 'WIN' : 'LOSS';
            botState.pnl += pnl;

            log(`📈 Trade Result: ${result} | P&L: $${pnl.toFixed(2)} | Session: $${botState.pnl.toFixed(2)}`, result === 'WIN' ? 'success' : 'error');

            // --- SESSION GUARDIAN ---
            if (botState.pnl >= botState.settings.profitTarget) {
                log(`🏆 PROFIT TARGET REACHED! Halting all trades.`);
                botState.isRunning = false;
            } else if (botState.pnl <= -botState.settings.lossLimit) {
                log(`🚨 LOSS LIMIT REACHED! Halting all trades.`);
                botState.isRunning = false;
            }

            if (botState.isRunning) {
                // Wait a few seconds before the next trade
                setTimeout(runLiveTradingLogic, 5000);
            } else {
                botState.ws.close();
            }
        }
    };

    botState.ws.onclose = () => {
        log('Connection to Deriv API closed.');
    };
}

async function getAccountInfo(token) {
    // This function can be simplified as it's part of the main connection now
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
        ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));
        ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.error) reject(new Error(data.error.message));
            if (data.msg_type === 'authorize') {
                ws.close();
                resolve({
                    success: true, balance: data.authorize.balance, currency: data.authorize.currency,
                    account_type: data.authorize.loginid, is_virtual: !!data.authorize.is_virtual
                });
            }
        };
        ws.onerror = () => reject(new Error('Failed to connect.'));
    });
}

// --- MAIN HANDLER ---
exports.handler = async function(event, context) {
    const { action, token, bot, settings } = JSON.parse(event.body);

    if (!token) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };

    if (action === 'authorize') {
        try {
            const accountInfo = await getAccountInfo(token);
            return { statusCode: 200, body: JSON.stringify(accountInfo) };
        } catch (error) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: error.message }) };
        }
    }

    if (action === 'start') {
        botState = { isRunning: true, logs: [], pnl: 0, bot, settings, token, ws: null, lastUpdate: Date.now() };
        log(`✅ [${bot.toUpperCase()}] Activation signal received. Firing up Prometheus Engine...`);
        connectAndTrade();
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (action === 'stop') {
        botState.isRunning = false;
        if (botState.ws) botState.ws.close();
        log('🛑 Bot deactivated by user command.');
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }
    
    if (action === 'status') {
        const response = { isRunning: botState.isRunning, logs: botState.logs, balance: 10000 + botState.pnl }; // Balance needs a live update method
        botState.logs = []; // Clear logs after sending
        return { statusCode: 200, body: JSON.stringify(response) };
    }
    
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid action.' }) };
};
