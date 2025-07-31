const { connectToDatabase } = require('./utils/mongodb-client');
const { requireAuth } = require('./utils/auth-middleware');

const handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const db = await connectToDatabase();
        const flagsCollection = db.collection('flags');
        const flags = await flagsCollection.find({ status: 'open' }).toArray();

        return {
            statusCode: 200,
            body: JSON.stringify(flags),
            headers: { 'Content-Type': 'application/json' },
        };
    } catch (error) {
        console.error('Error fetching flags:', error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};

exports.handler = requireAuth(handler); // Wrap the handler with the auth middleware
