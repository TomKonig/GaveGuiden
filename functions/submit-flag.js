const { connectToDatabase } = require('./utils/mongodb-client');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { productId, reason, quizAnswers } = JSON.parse(event.body);

    if (!productId || !reason) {
      return { statusCode: 400, body: 'Bad Request: Missing productId or reason.' };
    }
    
    // Privacy: remove user's name if present in quiz answers
    const safeQuizAnswers = { ...quizAnswers };
    if (safeQuizAnswers && safeQuizAnswers.name) {
      delete safeQuizAnswers.name;
    }

    const db = await connectToDatabase();
    const flagsCollection = db.collection('flags');

    const newFlag = {
      productId,
      reason,
      quizAnswers: safeQuizAnswers,
      status: 'open', // New field to track resolution
      createdAt: new Date(),
    };

    await flagsCollection.insertOne(newFlag);

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Problem reported successfully. Thank you for your feedback!' }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error submitting flag:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
