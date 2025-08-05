const { connectToDatabase } = require('./utils/mongodb-client');
const { requireAuth } = require('./utils/auth-middleware');

// The core logic of the function
const handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const db = await connectToDatabase();
        const ratingsCollection = db.collection('ratings');
        
        // Data Consistency: Reads from MongoDB
        const ratings = await ratingsCollection.find({}, { projection: { _id: 0 } }).toArray();

        return {
            statusCode: 200,
            body: JSON.stringify(ratings),
            headers: { 'Content-Type': 'application/json' },
        };
    } catch (error) {
        console.error('Error fetching ratings:', error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};

// Wrap the handler with the auth middleware before exporting
exports.handler = requireAuth(handler);
