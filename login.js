document.addEventListener('DOMContentLoaded', () => {
    const derivOauthBtn = document.getElementById('deriv-oauth-btn');
    const messageArea = document.getElementById('message-area');

    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
        messageArea.textContent = 'Authentication failed. Please try again.';
        messageArea.style.color = 'var(--danger-color)';
    }

    derivOauthBtn.addEventListener('click', () => {
        const appId = '106248';
        const derivOauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${appId}&l=EN&scopes=read,trade,trading_information,payments,admin`;
        window.location.href = derivOauthUrl;
    });
});