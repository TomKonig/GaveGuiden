const jwt = require('jsonwebtoken');

// IMPORTANT: For security, you must set these as environment variables
// in your Netlify site settings.
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'testAdmin!1').trim();
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secret-string-for-dev';

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { password } = JSON.parse(event.body);
        const userPassword = (password || '').trim();

        if (!password) {
            return { statusCode: 400, body: 'Bad Request: Missing password.' };
        }

        // Compare the provided password with the one stored securely
        if (userPassword === ADMIN_PASSWORD) {
            // If the password is correct, create a secure, temporary token.
            // This token proves the user is authenticated for a short period.
            const token = jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn: '1h' }); // Token is valid for 1 hour
            
            return {
                statusCode: 200,
                body: JSON.stringify({ token: token })
            };
        } else {
            // If the password is incorrect, deny access.
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
