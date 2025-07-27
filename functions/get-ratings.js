const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');

// This must match the secret key in your Netlify environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secret-string-for-dev';

const DATA_DIR = path.join(__dirname, '..', 'data');
const filePath = path.join(DATA_DIR, 'ratings.json');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Get the token from the Authorization header
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, body: 'Unauthorized: No token provided.' };
        }

        const token = authHeader.split(' ')[1];

        // Verify the token is valid
        jwt.verify(token, JWT_SECRET);

        // If token is valid, proceed to get the data
        let ratings = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            ratings = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        return {
            statusCode: 200,
            body: JSON.stringify(ratings)
        };

    } catch (error) {
        // If jwt.verify fails, it will throw an error
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return { statusCode: 401, body: 'Unauthorized: Invalid or expired token.' };
        }
        
        console.error('Error getting ratings:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
