const { connectToDatabase } = require('./utils/mongodb-client');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
    // 1. Authentication and Authorization
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
        return { statusCode: 401, body: 'Unauthorized' };
    }
    try {
        jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return { statusCode: 401, body: 'Invalid token' };
    }

    // 2. Get productId and reason from the request body
    const { productId, reason } = JSON.parse(event.body);
    if (!productId || !reason) {
        return { statusCode: 400, body: 'Bad Request: Missing productId or reason.' };
    }

    try {
        const db = await connectToDatabase();
        const flagsCollection = db.collection('flags');

        // 3. Update all open flags that match BOTH the productId and the reason
        const result = await flagsCollection.updateMany(
            { productId: productId, reason: reason, status: 'open' },
            { $set: { status: 'resolved', resolvedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'No open flags found for this product and reason.' }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Successfully resolved ${result.modifiedCount} flag(s).` }),
        };
    } catch (error) {
        console.error('Error resolving flag:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to resolve flag(s).' }),
        };
    }
};
