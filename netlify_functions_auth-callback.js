const fetch = require('node-fetch');
require('dotenv').config();

exports.handler = async function(event, context) {
    const authCode = event.queryStringParameters.code;

    // The URL of your live site. It's crucial this is correct.
    const redirectUri = `https://nexus-command-center.netlify.app/oauth-callback`;

    if (!authCode) {
        // Redirect back to login with a clear error
        return {
            statusCode: 302,
            headers: { 'Location': `/?error=Authorization%20was%20denied.` }
        };
    }
    
    try {
        const response = await fetch('https://oauth.deriv.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=authorization_code&code=${authCode}&client_id=${process.env.DERIV_APP_ID}&client_secret=${process.env.DERIV_APP_SECRET}&redirect_uri=${redirectUri}`
        });

        const data = await response.json();

        // **This is the new, more robust error handling:**
        if (data.error) {
            console.error("Deriv API Error:", data.error);
            const errorMessage = data.error.message || 'Invalid%20credentials%20or%20request.';
            // Redirect back to login with the specific error from Deriv
            return {
                statusCode: 302,
                headers: { 'Location': `/?error=${encodeURIComponent(errorMessage)}` }
            };
        }
        
        // On success, redirect to the dashboard with the token
        const successUrl = `/dashboard.html?token=${data.access_token}`;
        return {
            statusCode: 302,
            headers: { 'Location': successUrl }
        };

    } catch (error) {
        console.error("CRITICAL FUNCTION ERROR:", error);
        return {
            statusCode: 302,
            headers: { 'Location': '/?error=A%20critical%20server%20error%20occurred.' }
        };
    }
};
