const { connectToDatabase } = require('./utils/mongodb-client');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { product_id, quiz_answers } = JSON.parse(event.body);

        // --- Stricter Validation ---
        if (!product_id || typeof product_id !== 'string' || product_id.trim() === '') {
            return { statusCode: 400, body: 'Bad Request: Invalid or missing product_id.' };
        }
        if (!quiz_answers || typeof quiz_answers !== 'object') {
            return { statusCode: 400, body: 'Bad Request: Invalid or missing quiz_answers.' };
        }
        
        const safeQuizAnswers = { ...quiz_answers };
        if (safeQuizAnswers && safeQuizAnswers.name) {
            delete safeQuizAnswers.name;
        }

        const db = await connectToDatabase();
        const sharesCollection = db.collection('shares');

        const shareData = {
            productId: product_id.trim(),
            quizAnswers: safeQuizAnswers,
            createdAt: new Date(),
        };

        const result = await sharesCollection.insertOne(shareData);
        const shareId = result.insertedId;

        return {
            statusCode: 200,
            body: JSON.stringify({ shareId: shareId.toString() }),
        };

    } catch (error) {
        console.error('Error creating share link:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Could not create share link.' }),
        };
    }
};
