const { connectToDatabase } = require('./utils/mongodb-client');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { productId, rating } = JSON.parse(event.body);

    if (!productId || !rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return { statusCode: 400, body: 'Bad Request: Invalid productId or rating.' };
    }

    const db = await connectToDatabase();
    const ratingsCollection = db.collection('ratings');

    const newRating = {
      productId,
      rating: parseInt(rating),
      createdAt: new Date(),
    };

    await ratingsCollection.insertOne(newRating);

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Rating submitted successfully!' }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error submitting rating:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
