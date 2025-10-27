const WebSocket = require('ws');

// This state will be reset on every function invocation in a serverless environment.
// For a real bot, we need an external state manager (like Redis or FaunaDB).
// For now, this demonstrates the LIVE API connection.
let botState = { isRunning: false, logs: [], pnl: 0, bot: null, settings: {} };

// This function connects to Deriv, gets balance, and disconnects.
async function getAccountInfo(token) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089'); // A generic app_id for connection

        ws.onopen = () => {
            ws.send(JSON.stringify({ authorize: token }));
        };

        ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.error) {
                ws.close();
                reject(new Error(data.error.message));
            } else if (data.msg_type === 'authorize') {
                // Once authorized, ask for the balance
                ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
            } else if (data.msg_type === 'balance') {
                const accountInfo = data.balance;
                ws.close();
                resolve({
                    success: true,
                    balance: accountInfo.balance,
                    currency: accountInfo.currency,
                    account_type: accountInfo.loginid,
                    is_virtual: accountInfo.loginid.startsWith('VRTC')
                });
            }
        };

        ws.onerror = (err) => {
            reject(new Error('Failed to connect to Deriv API.'));
        };
    });
}

exports.handler = async function(event, context) {
    const { action, token, bot, settings } = JSON.parse(event.body);

    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
    }

    if (action === 'authorize') {
        try {
            const accountInfo = await getAccountInfo(token);
            return { statusCode: 200, body: JSON.stringify(accountInfo) };
        } catch (error) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: error.message }) };
        }
    }
    
    // The start/stop/status logic remains a simulation for now, but the authorization is REAL.
    // This proves the connection works before we risk money.
    if (action === 'start') {
        botState = { isRunning: true, logs: [`✅ [${bot.toUpperCase()}] Activated. Session Guardian armed.`], pnl: 0, bot: bot, settings: settings };
    } else if (action === 'stop') {
        botState.isRunning = false;
        botState.logs.push('🛑 Bot deactivated by user command.');
    } else if (action === 'status') {
        if (botState.isRunning) {
            const pnl = Math.random() > 0.5 ? 0.91 : -1.0;
            botState.pnl += pnl;
            botState.logs.push(`📈 [SIM] Trade Result: ${pnl > 0 ? 'WIN' : 'LOSS'} | Session P&L: $${botState.pnl.toFixed(2)}`);
        }
    }

    const response = { success: true, isRunning: botState.isRunning, logs: botState.logs, balance: 10000 + botState.pnl };
    botState.logs = []; // Clear logs

    return {
        statusCode: 200,
        body: JSON.stringify(response)
    };
};
