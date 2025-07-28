const { connectToDatabase } = require('./utils/mongodb-client');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { productId, reason, quizAnswers } = JSON.parse(event.body);

    // --- Stricter Validation ---
    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
        return { statusCode: 400, body: 'Bad Request: Invalid or missing productId.' };
    }
    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
        return { statusCode: 400, body: 'Bad Request: Invalid or missing reason.' };
    }
    if (quizAnswers && typeof quizAnswers !== 'object') {
        return { statusCode: 400, body: 'Bad Request: Invalid quizAnswers format.' };
    }
    
    // Privacy: remove user's name if present in quiz answers
    const safeQuizAnswers = { ...quizAnswers };
    if (safeQuizAnswers && safeQuizAnswers.name) {
      delete safeQuizAnswers.name;
    }

    const db = await connectToDatabase();
    const flagsCollection = db.collection('flags');

    const newFlag = {
      productId: productId.trim(),
      reason: reason.trim(),
      quizAnswers: safeQuizAnswers,
      status: 'open',
      createdAt: new Date(),
    };

    await flagsCollection.insertOne(newFlag);

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Problem reported successfully. Thank you for your feedback!' }),
    };
  } catch (error) {
    console.error('Error submitting flag:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
