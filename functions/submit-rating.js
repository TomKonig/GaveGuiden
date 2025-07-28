const { connectToDatabase } = require('./utils/mongodb-client');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { productId, rating } = JSON.parse(event.body);

    // --- Stricter Validation ---
    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
        return { statusCode: 400, body: 'Bad Request: Invalid or missing productId.' };
    }
    if (!rating || typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { statusCode: 400, body: 'Bad Request: Rating must be an integer between 1 and 5.' };
    }

    const db = await connectToDatabase();
    const ratingsCollection = db.collection('ratings');

    const newRating = {
      productId: productId.trim(),
      rating: rating,
      createdAt: new Date(),
    };

    await ratingsCollection.insertOne(newRating);

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Rating submitted successfully!' }),
    };
  } catch (error) {
    console.error('Error submitting rating:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
