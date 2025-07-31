const { connectToDatabase } = require('./utils/mongodb-client');
const { ObjectId } = require('mongodb');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const shareId = event.queryStringParameters.id;

    if (!shareId) {
        return { statusCode: 400, body: 'Bad Request: Missing share ID.' };
    }

    try {
        const db = await connectToDatabase();
        const sharesCollection = db.collection('shares');
        
        let objectId;
        try {
            objectId = new ObjectId(shareId);
        } catch(e) {
            return { statusCode: 400, body: 'Invalid Share ID format.' };
        }

        const sharedData = await sharesCollection.findOne({ _id: objectId });

        if (!sharedData) {
            return { statusCode: 404, body: 'Share link not found or expired.' };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                product_id: sharedData.productId,
                quiz_answers: sharedData.quizAnswers
            }),
            headers: { 'Content-Type': 'application/json' },
        };
    } catch (error) {
        console.error('Error fetching shared result:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Could not retrieve shared result.' }),
        };
    }
};
