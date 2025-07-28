const { connectToDatabase } = require('./utils/mongodb-client');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);

        if (!data.product_id || !data.quiz_answers) {
            return { statusCode: 400, body: 'Bad Request: Missing product_id or quiz_answers.' };
        }
        
        const safeQuizAnswers = { ...data.quiz_answers };
        if (safeQuizAnswers && safeQuizAnswers.name) {
            delete safeQuizAnswers.name;
        }

        const db = await connectToDatabase();
        const sharesCollection = db.collection('shares');

        const shareData = {
            productId: data.product_id,
            quizAnswers: safeQuizAnswers,
            createdAt: new Date(),
        };

        const result = await sharesCollection.insertOne(shareData);
        const shareId = result.insertedId;

        return {
            statusCode: 200,
            body: JSON.stringify({ shareId: shareId.toString() }),
            headers: { 'Content-Type': 'application/json' },
        };

    } catch (error) {
        console.error('Error creating share link:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Could not create share link.' }),
        };
    }
};
