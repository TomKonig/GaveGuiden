const fs = require('fs').promises;
const path = require('path');

// UPDATED: Path now points to the secure 'data' folder.
const DATA_DIR = path.join(__dirname, '..', 'data');
const filePath = path.join(DATA_DIR, 'ratings.json');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const ratingData = JSON.parse(event.body);

        if (!ratingData.product_id || !ratingData.rating || !ratingData.quiz_answers) {
            return { statusCode: 400, body: 'Bad Request: Missing required fields.' };
        }

        if (ratingData.quiz_answers && ratingData.quiz_answers.name) {
            delete ratingData.quiz_answers.name;
        }

        await fs.mkdir(DATA_DIR, { recursive: true });
        
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
