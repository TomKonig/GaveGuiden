const cookie = require('cookie');

exports.handler = async () => {
    // This cookie has an expiration date in the past, so the browser will remove it.
    const expiredCookie = cookie.serialize('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: new Date(0) // Set expiry date to the past
    });

    return {
        statusCode: 200,
        headers: {
            'Set-Cookie': expiredCookie,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Logout successful' })
    };
};
