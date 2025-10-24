// This is a simplified, in-memory bot state manager for a serverless environment.
// In a real-world scenario, you'd use a serverless database like FaunaDB or Upstash.
let botState = {
    isRunning: false,
    logs: [],
    pnl: 0,
    bot: null,
    settings: {},
    lastUpdate: 0
};

function log(message) {
    botState.logs.push(message);
}

function runBotLogic() {
    // This function simulates the bot's thinking process.
    if (!botState.isRunning) return;

    log(`🧠 [${botState.bot.toUpperCase()}] Analyzing market...`);
    
    const isWin = Math.random() < 0.55; // Simulate win rate
    const pnl = isWin ? 0.91 : -1.0;
    botState.pnl += pnl;

    log(`📈 Trade Result: ${isWin ? 'WIN' : 'LOSS'} | P&L: $${pnl.toFixed(2)} | Session: $${botState.pnl.toFixed(2)}`);

    if (botState.pnl >= botState.settings.profitTarget) {
        log(`🏆 PROFIT TARGET REACHED! Halting bot.`);
        botState.isRunning = false;
    }
    if (botState.pnl <= -botState.settings.lossLimit) {
        log(`🚨 LOSS LIMIT REACHED! Halting bot.`);
        botState.isRunning = false;
    }
}

exports.handler = async function(event, context) {
    const { action, token, bot, settings } = JSON.parse(event.body);

    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
    }
    
    if (action === 'start') {
        botState = {
            isRunning: true,
            logs: [],
            pnl: 0,
            bot: bot,
            settings: settings,
            lastUpdate: Date.now()
        };
        log(`✅ [${bot.toUpperCase()}] Activated. Session Guardian armed.`);
        runBotLogic(); // Run first cycle immediately
    } else if (action === 'stop') {
        botState.isRunning = false;
        log('🛑 Bot deactivated by user command.');
    } else if (action === 'status') {
        // In a serverless environment, we simulate ticks. If enough time has passed, run another cycle.
        if (botState.isRunning && Date.now() - botState.lastUpdate > 5000) {
            runBotLogic();
            botState.lastUpdate = Date.now();
        }
    }

    const response = {
        isRunning: botState.isRunning,
        logs: botState.logs,
        pnl: botState.pnl,
        balance: 10000 + botState.pnl // Simulate balance update
    };
    botState.logs = []; // Clear logs after sending them

    return {
        statusCode: 200,
        body: JSON.stringify(response)
    };
};