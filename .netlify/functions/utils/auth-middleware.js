const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const JWT_SECRET = process.env.JWT_SECRET;

function requireAuth(handler) {
    return async (event, context) => {
        if (!JWT_SECRET) {
            console.error('JWT_SECRET environment variable not set.');
            return { statusCode: 500, body: 'Server configuration error.' };
        }

        try {
            const cookies = cookie.parse(event.headers.cookie || '');
            const token = cookies.auth_token;

            if (!token) {
                return { statusCode: 401, body: 'Unauthorized: No token provided.' };
            }

            jwt.verify(token, JWT_SECRET);
            // If verification is successful, proceed to the original handler
            return handler(event, context);

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return { statusCode: 401, body: 'Unauthorized: Invalid token.' };
            }
            console.error('Auth middleware error:', error);
            return { statusCode: 500, body: 'Internal Server Error' };
        }
    };
}

module.exports = { requireAuth };
