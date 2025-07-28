const { connectToDatabase } = require('./utils/mongodb-client');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    // Security: Ensure JWT_SECRET is set, remove fallback
    if (!JWT_SECRET) {
        console.error('JWT_SECRET environment variable not set.');
        return { statusCode: 500, body: 'Server configuration error.' };
    }

    try {
        jwt.verify(token, JWT_SECRET);

        const db = await connectToDatabase();
        const ratingsCollection = db.collection('ratings');
        
        // Data Consistency: Now reads from MongoDB, not a stale file.
        const ratings = await ratingsCollection.find({}, { projection: { _id: 0 } }).toArray();

        return {
            statusCode: 200,
            body: JSON.stringify(ratings),
            headers: { 'Content-Type': 'application/json' },
        };
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return { statusCode: 401, body: 'Invalid token' };
        }
        console.error('Error fetching ratings:', error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};
