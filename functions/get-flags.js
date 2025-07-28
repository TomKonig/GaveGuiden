const { connectToDatabase } = require('./utils/mongodb-client');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
    // Security: Added HTTP method check
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    // Security: Ensure JWT_SECRET is set
    if (!JWT_SECRET) {
        console.error('JWT_SECRET environment variable not set.');
        return { statusCode: 500, body: 'Server configuration error.' };
    }

    try {
        jwt.verify(token, JWT_SECRET);

        const db = await connectToDatabase();
        // *** FIX: Changed 'ratings' to 'flags' ***
        const flagsCollection = db.collection('flags');
        
        // Find all flags that are currently 'open'
        const flags = await flagsCollection.find({ status: 'open' }).toArray();

        return {
            statusCode: 200,
            body: JSON.stringify(flags),
            headers: { 'Content-Type': 'application/json' },
        };
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return { statusCode: 401, body: 'Invalid token' };
        }
        console.error('Error fetching flags:', error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};
