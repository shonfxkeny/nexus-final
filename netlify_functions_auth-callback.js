const fetch = require('node-fetch');
require('dotenv').config();

exports.handler = async function(event, context) {
    const authCode = event.queryStringParameters.code;

    if (!authCode) {
        return { statusCode: 302, headers: { 'Location': '/?error=auth_failed' } };
    }
    
    try {
        const response = await fetch('https://oauth.deriv.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=authorization_code&code=${authCode}&client_id=${process.env.DERIV_APP_ID}&client_secret=${process.env.DERIV_APP_SECRET}&redirect_uri=${process.env.URL}/oauth-callback`
        });
        const data = await response.json();

        if (data.error) throw new Error(data.error.message || 'Token exchange failed');
        
        // **This is the critical fix:** Redirects to dashboard.html with the token
        const redirectUrl = `/dashboard.html?token=${data.access_token}`;
        return {
            statusCode: 302,
            headers: { 'Location': redirectUrl }
        };
    } catch (error) {
        console.error("CRITICAL ERROR exchanging token:", error);
        return { statusCode: 302, headers: { 'Location': '/?error=token_exchange_failed' } };
    }
};