const { connectToDatabase } = require('./utils/mongodb-client');
const { requireAuth } = require('./utils/auth-middleware');

const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { productId, reason } = JSON.parse(event.body);

        // --- Stricter Validation ---
        if (!productId || typeof productId !== 'string' || productId.trim() === '') {
            return { statusCode: 400, body: 'Bad Request: Invalid or missing productId.' };
        }
        if (!reason || typeof reason !== 'string' || reason.trim() === '') {
            return { statusCode: 400, body: 'Bad Request: Invalid or missing reason.' };
        }

        const db = await connectToDatabase();
        const flagsCollection = db.collection('flags');

        const result = await flagsCollection.updateMany(
            { productId: productId.trim(), reason: reason.trim(), status: 'open' },
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

exports.handler = requireAuth(handler);
