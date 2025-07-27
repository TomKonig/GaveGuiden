const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const ratingData = JSON.parse(event.body);

        // Basic validation
        if (!ratingData.product_id || !ratingData.rating || !ratingData.quiz_answers) {
            return { statusCode: 400, body: 'Bad Request: Missing required fields.' };
        }

        // GDPR Compliance: Anonymize data by removing the name field
        if (ratingData.quiz_answers && ratingData.quiz_answers.name) {
            delete ratingData.quiz_answers.name;
        }

        const filePath = path.join(__dirname, '..', 'assets', 'ratings.json');
        
        let ratings = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            ratings = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        ratings.push(ratingData);

        await fs.writeFile(filePath, JSON.stringify(ratings, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Rating submitted successfully' })
        };

    } catch (error) {
        console.error('Error processing rating:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
