const jwt = require('jsonwebtoken');
const cookie = require('cookie');

exports.handler = async (event) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return { statusCode: 500, body: 'Server configuration error.' };
    }

    try {
        const cookies = cookie.parse(event.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) {
            return { statusCode: 401, body: 'Not authenticated' };
        }

        jwt.verify(token, jwtSecret);
        // If verify succeeds, the token is valid
        return { statusCode: 200, body: 'Authenticated' };

    } catch (error) {
        return { statusCode: 401, body: 'Not authenticated' };
    }
};
